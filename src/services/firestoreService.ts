import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, handleFirestoreError, OperationType, storage } from '../lib/firebase';
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_COURSES,
  INITIAL_INSTRUCTORS,
  INITIAL_LESSONS,
  INITIAL_SETTINGS,
  INITIAL_TESTIMONIALS,
  INITIAL_TRACKS,
} from '../lib/seedData';
import { generateId, sanitizeText } from '../lib/validation';
import type {
  AcademySettings,
  Announcement,
  Application,
  ApplicationStatus,
  AuditLog,
  Certificate,
  ContactMessage,
  Course,
  CourseComment,
  Enrollment,
  Instructor,
  LearningTrack,
  Lesson,
  NotificationItem,
  PaymentRecord,
  StudentUser,
  Testimonial,
} from '../types';

// --- Storage Upload Helper ---
export async function uploadImageToStorage(file: File, storagePath: string): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files (PNG, JPG, WebP) are supported.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image file must be smaller than 5 MB.');
  }
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(snapshot.ref);
}

// --- Seed Initial Academy Data (Idempotent, Admin-only) ---
export async function seedAcademyData(actorEmail = 'admin'): Promise<{ seeded: boolean }> {
  try {
    const batch = writeBatch(db);
    const now = serverTimestamp();

    const settingsRef = doc(db, 'settings', 'global');
    const existingSettings = await getDoc(settingsRef);
    if (!existingSettings.exists()) {
      batch.set(settingsRef, { ...INITIAL_SETTINGS, updatedAt: now });
    }

    for (const inst of INITIAL_INSTRUCTORS) {
      const refDoc = doc(db, 'instructors', inst.id);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) {
        batch.set(refDoc, { ...inst, createdAt: now, updatedAt: now });
      }
    }

    for (const track of INITIAL_TRACKS) {
      const refDoc = doc(db, 'tracks', track.id);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) {
        batch.set(refDoc, { ...track, createdAt: now, updatedAt: now });
      }
    }

    for (const course of INITIAL_COURSES) {
      const refDoc = doc(db, 'courses', course.id);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) {
        batch.set(refDoc, { ...course, createdAt: now, updatedAt: now });
      }
    }

    for (const lesson of INITIAL_LESSONS) {
      const refDoc = doc(db, 'courses', lesson.courseId, 'lessons', lesson.id);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) {
        batch.set(refDoc, { ...lesson, createdAt: now, updatedAt: now });
      }
    }

    for (const testi of INITIAL_TESTIMONIALS) {
      const refDoc = doc(db, 'testimonials', testi.id);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) {
        batch.set(refDoc, { ...testi, createdAt: now, updatedAt: now });
      }
    }

    for (const ann of INITIAL_ANNOUNCEMENTS) {
      const refDoc = doc(db, 'announcements', ann.id);
      const snap = await getDoc(refDoc);
      if (!snap.exists()) {
        batch.set(refDoc, { ...ann, createdAt: now, updatedAt: now });
      }
    }

    const logId = generateId('log');
    batch.set(doc(db, 'auditLogs', logId), {
      id: logId,
      actor: actorEmail,
      action: 'SEED_INITIAL_DATA',
      targetType: 'system',
      targetId: 'global',
      details: 'Initialized 4 learning tracks, 3 instructors, sample courses, and academy settings.',
      createdAt: now,
    });

    await batch.commit();
    return { seeded: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedAcademyData');
  }
}

// --- Settings ---
export async function getAcademySettings(): Promise<AcademySettings | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'global'));
    return snap.exists() ? (snap.data() as AcademySettings) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'settings/global');
  }
}

export async function saveAcademySettings(
  settings: Omit<AcademySettings, 'updatedAt'>,
  actor = 'admin'
): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'global'), {
      ...settings,
      id: 'global',
      updatedAt: serverTimestamp(),
    });
    await createAuditLog(actor, 'UPDATE_SETTINGS', 'settings', 'global', 'Updated academy settings');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/global');
  }
}

// --- Public Queries ---
export async function getPublishedTracks(): Promise<LearningTrack[]> {
  try {
    const q = query(
      collection(db, 'tracks'),
      where('isPublished', '==', true),
      where('isArchived', '==', false)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LearningTrack);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'tracks');
  }
}

export async function getTrackBySlug(slug: string): Promise<LearningTrack | null> {
  try {
    const q = query(
      collection(db, 'tracks'),
      where('slug', '==', slug),
      where('isPublished', '==', true),
      where('isArchived', '==', false),
      limit(1)
    );
    const snap = await getDocs(q);
    return snap.empty ? null : (snap.docs[0].data() as LearningTrack);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `tracks/${slug}`);
  }
}

export async function getActiveInstructors(): Promise<Instructor[]> {
  try {
    const snap = await getDocs(collection(db, 'instructors'));
    return snap.docs.map((d) => d.data() as Instructor).filter((i) => i.isActive !== false);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'instructors');
  }
}

export async function getPublishedCourses(): Promise<Course[]> {
  try {
    const q = query(
      collection(db, 'courses'),
      where('isPublished', '==', true),
      where('isArchived', '==', false)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Course);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'courses');
  }
}

export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  try {
    const q = query(collection(db, 'testimonials'), where('isApproved', '==', true), limit(12));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Testimonial);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'testimonials');
  }
}

export async function getPublishedAnnouncements(): Promise<Announcement[]> {
  try {
    const q = query(collection(db, 'announcements'), where('isPublished', '==', true), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Announcement);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'announcements');
  }
}

// --- Contact Messages ---
export async function submitContactMessage(payload: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<void> {
  const id = generateId('msg');
  try {
    await setDoc(doc(db, 'contactMessages', id), {
      id,
      name: sanitizeText(payload.name, 120),
      email: sanitizeText(payload.email, 200),
      phone: sanitizeText(payload.phone || '', 40),
      subject: sanitizeText(payload.subject, 200),
      message: sanitizeText(payload.message, 2000),
      status: 'new',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `contactMessages/${id}`);
  }
}

// --- Student Profile ---
export async function getStudentProfile(uid: string): Promise<StudentUser | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as StudentUser) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function updateStudentProfile(
  uid: string,
  updates: { fullName: string; phone?: string; bio?: string; avatarUrl?: string }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      fullName: sanitizeText(updates.fullName, 120),
      phone: sanitizeText(updates.phone || '', 40),
      bio: sanitizeText(updates.bio || '', 500),
      avatarUrl: sanitizeText(updates.avatarUrl || '', 1000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

// --- Applications ---
export async function getStudentApplications(studentUid: string): Promise<Application[]> {
  try {
    const q = query(collection(db, 'applications'), where('studentUid', '==', studentUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Application);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'applications');
  }
}

export async function submitTrackApplication(payload: {
  studentUid: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  track: LearningTrack;
  message?: string;
}): Promise<Application> {
  try {
    // Prevent duplicate pending/under_review/accepted/enrolled applications for the same track
    const existingQ = query(
      collection(db, 'applications'),
      where('studentUid', '==', payload.studentUid),
      where('trackId', '==', payload.track.id)
    );
    const existingSnap = await getDocs(existingQ);
    const activeDuplicate = existingSnap.docs.find((d) => {
      const st = (d.data() as Application).status;
      return st === 'pending' || st === 'under_review' || st === 'accepted' || st === 'enrolled';
    });
    if (activeDuplicate) {
      throw new Error('DUPLICATE_PENDING_APPLICATION');
    }

    const id = generateId('app');
    const now = serverTimestamp();
    const appDoc = {
      id,
      studentUid: payload.studentUid,
      studentName: sanitizeText(payload.studentName, 120),
      studentEmail: sanitizeText(payload.studentEmail, 200),
      studentPhone: sanitizeText(payload.studentPhone, 40),
      trackId: payload.track.id,
      trackTitleEn: payload.track.titleEn,
      trackTitleAr: payload.track.titleAr,
      message: sanitizeText(payload.message || '', 1500),
      status: 'pending' as ApplicationStatus,
      createdAt: now,
      updatedAt: now,
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'applications', id), appDoc);

    // Notify student of submission
    const studentNotifId = generateId('notif');
    batch.set(doc(db, 'notifications', studentNotifId), {
      id: studentNotifId,
      recipientUid: payload.studentUid,
      type: 'application_submitted',
      titleEn: `Application Received: ${payload.track.titleEn}`,
      titleAr: `تم استلام طلبك: ${payload.track.titleAr}`,
      bodyEn: `Your application for ${payload.track.titleEn} has been submitted and is pending review.`,
      bodyAr: `تم تقديم طلبك للالتحاق بمسار ${payload.track.titleAr} وهو الآن قيد المراجعة.`,
      actionUrl: '/dashboard/applications',
      isRead: false,
      createdAt: now,
      updatedAt: now,
    });

    // Notify administrator immediately
    const adminNotifId = generateId('notif');
    batch.set(doc(db, 'notifications', adminNotifId), {
      id: adminNotifId,
      recipientUid: 'admin',
      type: 'application_submitted',
      titleEn: `New Track Application: ${payload.track.titleEn}`,
      titleAr: `طلب التحاق جديد: ${payload.track.titleAr}`,
      bodyEn: `${appDoc.studentName} (${appDoc.studentPhone}) applied for ${payload.track.titleEn}.`,
      bodyAr: `تقدّم ${appDoc.studentName} (${appDoc.studentPhone}) لمسار ${payload.track.titleAr}.`,
      actionUrl: '/admin/applications',
      isRead: false,
      createdAt: now,
      updatedAt: now,
    });

    await batch.commit();
    return appDoc as unknown as Application;
  } catch (error) {
    if (error instanceof Error && error.message === 'DUPLICATE_PENDING_APPLICATION') {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, 'applications');
  }
}

// --- Courses, Lessons, Enrollments, Comments ---
export async function getStudentEnrollments(studentUid: string): Promise<Enrollment[]> {
  try {
    const q = query(collection(db, 'enrollments'), where('studentUid', '==', studentUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Enrollment);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'enrollments');
  }
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  try {
    const snap = await getDoc(doc(db, 'courses', courseId));
    return snap.exists() ? (snap.data() as Course) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `courses/${courseId}`);
  }
}

export async function getCourseLessons(
  courseId: string,
  hasFullAccess: boolean
): Promise<Lesson[]> {
  try {
    const lessonsCol = collection(db, 'courses', courseId, 'lessons');
    const q = hasFullAccess
      ? query(lessonsCol, orderBy('orderIndex', 'asc'))
      : query(lessonsCol, where('isFreePreview', '==', true));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => d.data() as Lesson);
    return items.sort((a, b) => a.orderIndex - b.orderIndex);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `courses/${courseId}/lessons`);
  }
}

export async function toggleLessonCompletion(
  enrollmentId: string,
  lessonId: string,
  completedIds: string[]
): Promise<string[]> {
  const exists = completedIds.includes(lessonId);
  const nextIds = exists
    ? completedIds.filter((id) => id !== lessonId)
    : [...completedIds, lessonId];
  try {
    await updateDoc(doc(db, 'enrollments', enrollmentId), {
      completedLessonIds: nextIds,
      updatedAt: serverTimestamp(),
    });
    return nextIds;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `enrollments/${enrollmentId}`);
  }
}

export async function getCourseComments(
  courseId: string,
  isAdminView = false
): Promise<CourseComment[]> {
  try {
    const q = isAdminView
      ? query(collection(db, 'comments'), where('courseId', '==', courseId))
      : query(
          collection(db, 'comments'),
          where('courseId', '==', courseId),
          where('status', '==', 'approved')
        );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as CourseComment);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'comments');
  }
}

export async function postCourseComment(payload: {
  courseId: string;
  courseTitle: string;
  studentUid: string;
  studentName: string;
  studentAvatarUrl?: string;
  content: string;
}): Promise<CourseComment> {
  const id = generateId('cmt');
  const now = serverTimestamp();
  const commentData = {
    id,
    courseId: payload.courseId,
    studentUid: payload.studentUid,
    studentName: sanitizeText(payload.studentName, 120),
    studentAvatarUrl: sanitizeText(payload.studentAvatarUrl || '', 1000),
    content: sanitizeText(payload.content, 1000),
    status: 'approved' as const,
    createdAt: now,
    updatedAt: now,
  };
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'comments', id), commentData);

    const adminNotifId = generateId('notif');
    batch.set(doc(db, 'notifications', adminNotifId), {
      id: adminNotifId,
      recipientUid: 'admin',
      type: 'new_comment',
      titleEn: `New Course Comment on ${payload.courseTitle}`,
      titleAr: `تعليق جديد على كورس ${payload.courseTitle}`,
      bodyEn: `${commentData.studentName}: "${commentData.content.slice(0, 120)}"`,
      bodyAr: `${commentData.studentName}: "${commentData.content.slice(0, 120)}"`,
      actionUrl: '/admin/courses',
      isRead: false,
      createdAt: now,
      updatedAt: now,
    });
    await batch.commit();
    return commentData as unknown as CourseComment;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `comments/${id}`);
  }
}

// --- Certificates ---
export async function getStudentCertificates(studentUid: string): Promise<Certificate[]> {
  try {
    const q = query(collection(db, 'certificates'), where('studentUid', '==', studentUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Certificate);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'certificates');
  }
}

export async function verifyCertificateById(certificateId: string): Promise<Certificate | null> {
  const cleanId = certificateId.trim();
  if (!cleanId) return null;
  try {
    const snap = await getDoc(doc(db, 'certificates', cleanId));
    return snap.exists() ? (snap.data() as Certificate) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `certificates/${cleanId}`);
  }
}

// --- Notifications (Real-time listeners) ---
export function subscribeToNotifications(
  recipientUid: string,
  onData: (items: NotificationItem[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', recipientUid),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as NotificationItem)
        .sort((a, b) => {
          const sa = a.createdAt?.seconds || 0;
          const sb = b.createdAt?.seconds || 0;
          return sb - sa;
        });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    }
  );
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function markAllNotificationsRead(items: NotificationItem[]): Promise<void> {
  const unread = items.filter((n) => !n.isRead);
  if (unread.length === 0) return;
  try {
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, 'notifications', n.id), {
        isRead: true,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications/batch');
  }
}

// --- Admin Operations ---
export async function createAuditLog(
  actor: string,
  action: string,
  targetType: string,
  targetId: string,
  details = ''
): Promise<void> {
  const id = generateId('log');
  try {
    await setDoc(doc(db, 'auditLogs', id), {
      id,
      actor: sanitizeText(actor, 160),
      action: sanitizeText(action, 120),
      targetType: sanitizeText(targetType, 80),
      targetId: sanitizeText(targetId, 128),
      details: sanitizeText(details, 1000),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Do not block primary admin workflow if audit write fails
  }
}

export async function adminGetAllCollections() {
  try {
    const [
      studentsSnap,
      appsSnap,
      tracksSnap,
      instructorsSnap,
      coursesSnap,
      certsSnap,
      paymentsSnap,
      announcementsSnap,
      testimonialsSnap,
      commentsSnap,
      contactsSnap,
      auditSnap,
    ] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'applications')),
      getDocs(collection(db, 'tracks')),
      getDocs(collection(db, 'instructors')),
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'certificates')),
      getDocs(collection(db, 'payments')),
      getDocs(collection(db, 'announcements')),
      getDocs(collection(db, 'testimonials')),
      getDocs(collection(db, 'comments')),
      getDocs(collection(db, 'contactMessages')),
      getDocs(query(collection(db, 'auditLogs'), limit(50))),
    ]);

    return {
      students: studentsSnap.docs.map((d) => d.data() as StudentUser),
      applications: appsSnap.docs.map((d) => d.data() as Application),
      tracks: tracksSnap.docs.map((d) => d.data() as LearningTrack),
      instructors: instructorsSnap.docs.map((d) => d.data() as Instructor),
      courses: coursesSnap.docs.map((d) => d.data() as Course),
      certificates: certsSnap.docs.map((d) => d.data() as Certificate),
      payments: paymentsSnap.docs.map((d) => d.data() as PaymentRecord),
      announcements: announcementsSnap.docs.map((d) => d.data() as Announcement),
      testimonials: testimonialsSnap.docs.map((d) => d.data() as Testimonial),
      comments: commentsSnap.docs.map((d) => d.data() as CourseComment),
      contactMessages: contactsSnap.docs.map((d) => d.data() as ContactMessage),
      auditLogs: auditSnap.docs.map((d) => d.data() as AuditLog),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin_dashboard');
  }
}

export async function adminUpdateApplicationStatus(payload: {
  application: Application;
  newStatus: ApplicationStatus;
  adminMessage?: string;
  internalNote?: string;
  trackGoogleFormUrl?: string;
  contactPhone?: string;
  actor?: string;
}): Promise<void> {
  const { application, newStatus, adminMessage, internalNote, trackGoogleFormUrl, contactPhone, actor } =
    payload;
  const phone = contactPhone || '01012329975';
  const now = serverTimestamp();

  try {
    const batch = writeBatch(db);
    const appRef = doc(db, 'applications', application.id);
    batch.update(appRef, {
      status: newStatus,
      adminMessage: sanitizeText(adminMessage || '', 1500),
      internalNote: sanitizeText(internalNote || '', 1500),
      googleFormUrl: sanitizeText(trackGoogleFormUrl || application.googleFormUrl || '', 500),
      updatedAt: now,
    });

    // If accepted: notify student with exact required wording & phone 01012329975 + Google Form URL if set
    if (newStatus === 'accepted') {
      const notifId = generateId('notif');
      const formUrl = trackGoogleFormUrl || application.googleFormUrl || '';
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientUid: application.studentUid,
        type: 'application_accepted',
        titleEn: `Application Accepted — ${application.trackTitleEn}`,
        titleAr: `تم قبول طلبك — ${application.trackTitleAr}`,
        bodyEn: `Congratulations! Your application for ${application.trackTitleEn} at Syntax Academy has been accepted.\n\nPlease contact us at ${phone} to receive the Google Form required to complete your registration.${adminMessage ? `\n\nNote from Admissions: ${sanitizeText(adminMessage, 500)}` : ''}`,
        bodyAr: `تهانينا! تم قبول طلبك للالتحاق بمسار ${application.trackTitleAr} في Syntax Academy.\n\nيرجى التواصل معنا على الرقم ${phone} لاستلام نموذج Google Form المطلوب لإتمام تسجيلك.${adminMessage ? `\n\nرسالة الإدارة: ${sanitizeText(adminMessage, 500)}` : ''}`,
        actionUrl: '/dashboard/applications',
        phoneNumber: phone,
        googleFormUrl: formUrl,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    // If rejected: polite notification WITHOUT exposing internal administrative notes
    if (newStatus === 'rejected') {
      const notifId = generateId('notif');
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientUid: application.studentUid,
        type: 'application_rejected',
        titleEn: `Application Update — ${application.trackTitleEn}`,
        titleAr: `تحديث حالة الطلب — ${application.trackTitleAr}`,
        bodyEn: `Thank you for applying to ${application.trackTitleEn} at Syntax Academy. Unfortunately, your application was not selected for this cohort.${adminMessage ? ` ${sanitizeText(adminMessage, 500)}` : ''}`,
        bodyAr: `شكرًا لتقديمك على مسار ${application.trackTitleAr} في Syntax Academy. نعتذر لعدم قبول طلبك في هذه الدفعة.${adminMessage ? ` ${sanitizeText(adminMessage, 500)}` : ''}`,
        actionUrl: '/dashboard/applications',
        isRead: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    // If enrolled: grant real Firestore enrollment document so student unlocks restricted courses
    if (newStatus === 'enrolled') {
      const enrollmentId = `${application.studentUid}_${application.trackId}`;
      const enrollRef = doc(db, 'enrollments', enrollmentId);
      const existingEnroll = await getDoc(enrollRef);
      if (!existingEnroll.exists()) {
        batch.set(enrollRef, {
          id: enrollmentId,
          studentUid: application.studentUid,
          trackId: application.trackId,
          status: 'active',
          completedLessonIds: [],
          enrolledAt: now,
          updatedAt: now,
        });
      } else {
        batch.update(enrollRef, { status: 'active', updatedAt: now });
      }

      const notifId = generateId('notif');
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientUid: application.studentUid,
        type: 'course_available',
        titleEn: `Enrollment Active — ${application.trackTitleEn}`,
        titleAr: `تم تفعيل تسجيلك — ${application.trackTitleAr}`,
        bodyEn: `Your enrollment in ${application.trackTitleEn} is now active. All track courses and lessons are unlocked in your Student Dashboard.`,
        bodyAr: `تم تفعيل تسجيلك في مسار ${application.trackTitleAr}. جميع الدروس والكورسات متاحة الآن في لوحة الطالب.`,
        actionUrl: '/dashboard/courses',
        isRead: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();
    await createAuditLog(
      actor || 'admin',
      `APPLICATION_${newStatus.toUpperCase()}`,
      'application',
      application.id,
      `Updated application for ${application.studentName} (${application.trackTitleEn})`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `applications/${application.id}`);
  }
}

export async function adminSaveTrack(
  track: Omit<LearningTrack, 'createdAt' | 'updatedAt'>,
  isNew: boolean,
  actor = 'admin'
): Promise<void> {
  try {
    const refDoc = doc(db, 'tracks', track.id);
    const now = serverTimestamp();
    if (isNew) {
      await setDoc(refDoc, { ...track, createdAt: now, updatedAt: now });
    } else {
      await updateDoc(refDoc, { ...track, updatedAt: now });
    }
    await createAuditLog(
      actor,
      isNew ? 'CREATE_TRACK' : 'UPDATE_TRACK',
      'track',
      track.id,
      track.titleEn
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `tracks/${track.id}`);
  }
}

export async function adminArchiveTrack(trackId: string, archive: boolean, actor = 'admin') {
  try {
    await updateDoc(doc(db, 'tracks', trackId), {
      isArchived: archive,
      isPublished: archive ? false : true,
      updatedAt: serverTimestamp(),
    });
    await createAuditLog(
      actor,
      archive ? 'ARCHIVE_TRACK' : 'RESTORE_TRACK',
      'track',
      trackId
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tracks/${trackId}`);
  }
}

export async function adminSaveInstructor(
  instructor: Omit<Instructor, 'createdAt' | 'updatedAt'>,
  isNew: boolean,
  actor = 'admin'
): Promise<void> {
  try {
    const refDoc = doc(db, 'instructors', instructor.id);
    const now = serverTimestamp();
    if (isNew) {
      await setDoc(refDoc, { ...instructor, createdAt: now, updatedAt: now });
    } else {
      await updateDoc(refDoc, { ...instructor, updatedAt: now });
    }
    await createAuditLog(
      actor,
      isNew ? 'CREATE_INSTRUCTOR' : 'UPDATE_INSTRUCTOR',
      'instructor',
      instructor.id,
      instructor.nameEn
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `instructors/${instructor.id}`);
  }
}

export async function adminDeleteInstructor(instructorId: string, actor = 'admin'): Promise<void> {
  try {
    await deleteDoc(doc(db, 'instructors', instructorId));
    await createAuditLog(actor, 'DELETE_INSTRUCTOR', 'instructor', instructorId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `instructors/${instructorId}`);
  }
}

export async function adminSaveCourse(
  course: Omit<Course, 'createdAt' | 'updatedAt'>,
  isNew: boolean,
  actor = 'admin'
): Promise<void> {
  try {
    const refDoc = doc(db, 'courses', course.id);
    const now = serverTimestamp();
    if (isNew) {
      await setDoc(refDoc, { ...course, createdAt: now, updatedAt: now });
    } else {
      await updateDoc(refDoc, { ...course, updatedAt: now });
    }
    await createAuditLog(
      actor,
      isNew ? 'CREATE_COURSE' : 'UPDATE_COURSE',
      'course',
      course.id,
      course.titleEn
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `courses/${course.id}`);
  }
}

export async function adminSaveLesson(
  lesson: Omit<Lesson, 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  try {
    const refDoc = doc(db, 'courses', lesson.courseId, 'lessons', lesson.id);
    const now = serverTimestamp();
    if (isNew) {
      await setDoc(refDoc, { ...lesson, createdAt: now, updatedAt: now });
    } else {
      await updateDoc(refDoc, { ...lesson, updatedAt: now });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `courses/${lesson.courseId}/lessons/${lesson.id}`
    );
  }
}

export async function adminDeleteLesson(courseId: string, lessonId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'lessons', lessonId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `courses/${courseId}/lessons/${lessonId}`);
  }
}

export async function adminModerateComment(
  commentId: string,
  updates: { status?: 'approved' | 'hidden'; adminReply?: string },
  actor = 'admin'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'comments', commentId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    await createAuditLog(actor, 'MODERATE_COMMENT', 'comment', commentId);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
  }
}

export async function adminDeleteComment(commentId: string, actor = 'admin'): Promise<void> {
  try {
    await deleteDoc(doc(db, 'comments', commentId));
    await createAuditLog(actor, 'DELETE_COMMENT', 'comment', commentId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
  }
}

export async function adminIssueCertificate(
  cert: Omit<Certificate, 'issuedAt' | 'updatedAt' | 'status'>,
  actor = 'admin'
): Promise<Certificate> {
  const cleanId = cert.certificateId.trim();
  const refDoc = doc(db, 'certificates', cleanId);
  try {
    const existing = await getDoc(refDoc);
    if (existing.exists()) {
      throw new Error('DUPLICATE_CERTIFICATE_ID');
    }

    const now = serverTimestamp();
    const payload = {
      ...cert,
      certificateId: cleanId,
      status: 'valid' as const,
      issuedAt: now,
      updatedAt: now,
    };

    const batch = writeBatch(db);
    batch.set(refDoc, payload);

    if (cert.studentUid) {
      const notifId = generateId('notif');
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientUid: cert.studentUid,
        type: 'certificate_issued',
        titleEn: `Certificate Issued — ${cert.trackName}`,
        titleAr: `تم إصدار شهادتك — ${cert.trackName}`,
        bodyEn: `Your official Certificate of Completion (${cleanId}) for ${cert.trackName} is ready to view and download in your dashboard.`,
        bodyAr: `شهادة إتمام مسار ${cert.trackName} (${cleanId}) جاهزة الآن للمعاينة والتحميل من لوحة الطالب.`,
        actionUrl: '/dashboard/certificates',
        isRead: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();
    await createAuditLog(
      actor,
      'ISSUE_CERTIFICATE',
      'certificate',
      cleanId,
      `Issued to ${cert.studentFullName} for ${cert.trackName}`
    );
    return payload as unknown as Certificate;
  } catch (error) {
    if (error instanceof Error && error.message === 'DUPLICATE_CERTIFICATE_ID') {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, `certificates/${cleanId}`);
  }
}

export async function adminUpdateCertificateStatus(
  certificateId: string,
  status: 'valid' | 'revoked',
  revokedReason = '',
  actor = 'admin'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'certificates', certificateId), {
      status,
      revokedReason: sanitizeText(revokedReason, 300),
      updatedAt: serverTimestamp(),
    });
    await createAuditLog(
      actor,
      status === 'revoked' ? 'REVOKE_CERTIFICATE' : 'RESTORE_CERTIFICATE',
      'certificate',
      certificateId,
      revokedReason
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `certificates/${certificateId}`);
  }
}

export async function adminUpdateStudentAccount(
  uid: string,
  updates: { status?: 'active' | 'suspended'; internalNotes?: string },
  actor = 'admin'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    await createAuditLog(actor, 'UPDATE_STUDENT', 'user', uid, JSON.stringify(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function adminSavePayment(
  payment: Omit<PaymentRecord, 'createdAt' | 'updatedAt'>,
  isNew: boolean,
  actor = 'admin'
): Promise<void> {
  try {
    const refDoc = doc(db, 'payments', payment.id);
    const now = serverTimestamp();
    if (isNew) {
      await setDoc(refDoc, { ...payment, createdAt: now, updatedAt: now });
    } else {
      await updateDoc(refDoc, { ...payment, updatedAt: now });
    }
    await createAuditLog(
      actor,
      isNew ? 'CREATE_PAYMENT' : 'UPDATE_PAYMENT',
      'payment',
      payment.id,
      `${payment.studentName} - ${payment.amountPaid}/${payment.totalFee} EGP (${payment.status})`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `payments/${payment.id}`);
  }
}

export async function adminSaveAnnouncement(
  ann: Omit<Announcement, 'createdAt' | 'updatedAt'>,
  isNew: boolean,
  actor = 'admin'
): Promise<void> {
  try {
    const refDoc = doc(db, 'announcements', ann.id);
    const now = serverTimestamp();
    if (isNew) {
      await setDoc(refDoc, { ...ann, createdAt: now, updatedAt: now });
    } else {
      await updateDoc(refDoc, { ...ann, updatedAt: now });
    }
    await createAuditLog(
      actor,
      isNew ? 'CREATE_ANNOUNCEMENT' : 'UPDATE_ANNOUNCEMENT',
      'announcement',
      ann.id
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `announcements/${ann.id}`);
  }
}

export async function adminDeleteAnnouncement(id: string, actor = 'admin'): Promise<void> {
  try {
    await deleteDoc(doc(db, 'announcements', id));
    await createAuditLog(actor, 'DELETE_ANNOUNCEMENT', 'announcement', id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
  }
}

export async function adminSaveTestimonial(
  item: Omit<Testimonial, 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  try {
    const refDoc = doc(db, 'testimonials', item.id);
    const now = serverTimestamp();
    if (isNew) {
      await setDoc(refDoc, { ...item, createdAt: now, updatedAt: now });
    } else {
      await updateDoc(refDoc, { ...item, updatedAt: now });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `testimonials/${item.id}`);
  }
}

export async function adminDeleteTestimonial(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'testimonials', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `testimonials/${id}`);
  }
}

export async function adminResolveContactMessage(id: string, status: 'new' | 'resolved') {
  try {
    await updateDoc(doc(db, 'contactMessages', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `contactMessages/${id}`);
  }
}
