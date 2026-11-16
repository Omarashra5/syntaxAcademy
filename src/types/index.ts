export type Language = 'en' | 'ar';
export type ThemeMode = 'dark' | 'light';

export type TrackCategory = 'programming' | 'office' | 'language' | 'program';
export type ApplicationStatus = 'pending' | 'under_review' | 'accepted' | 'rejected' | 'enrolled';
export type CommentStatus = 'pending' | 'approved' | 'hidden';
export type CertificateStatus = 'valid' | 'revoked';
export type PaymentStatus = 'pending' | 'partially_paid' | 'paid';

export type NotificationType =
  | 'application_submitted'
  | 'application_accepted'
  | 'application_rejected'
  | 'course_available'
  | 'certificate_issued'
  | 'announcement'
  | 'new_student'
  | 'new_comment'
  | 'new_contact';

export interface FirestoreTimestampLike {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
}

export interface StudentUser {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  role: 'student';
  status: 'active' | 'suspended';
  internalNotes?: string;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface Instructor {
  id: string;
  nameEn: string;
  nameAr: string;
  specializationEn: string;
  specializationAr: string;
  bioEn?: string;
  bioAr?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface CurriculumSection {
  titleEn: string;
  titleAr: string;
  topicsEn: string[];
  topicsAr: string[];
}

export interface TrackFaq {
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
}

export interface LearningTrack {
  id: string;
  slug: string;
  category: TrackCategory;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  thumbnailUrl?: string;
  originalPrice: number;
  discountedPrice: number;
  durationEn?: string;
  durationAr?: string;
  instructorId: string;
  skills?: string[];
  objectivesEn?: string[];
  objectivesAr?: string[];
  curriculum?: CurriculumSection[];
  technologies?: string[];
  faqs?: TrackFaq[];
  googleFormUrl?: string;
  isPublished: boolean;
  applicationsOpen: boolean;
  isArchived: boolean;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface Application {
  id: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  trackId: string;
  trackTitleEn: string;
  trackTitleAr: string;
  message?: string;
  status: ApplicationStatus;
  adminMessage?: string;
  internalNote?: string;
  googleFormUrl?: string;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface Course {
  id: string;
  trackId: string;
  instructorId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  isPublished: boolean;
  isPublicPreview: boolean;
  isArchived: boolean;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface Lesson {
  id: string;
  courseId: string;
  sectionTitleEn?: string;
  sectionTitleAr?: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  videoUrl?: string;
  durationMinutes?: number;
  orderIndex: number;
  isFreePreview: boolean;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface Enrollment {
  id: string;
  studentUid: string;
  trackId: string;
  status: 'active' | 'completed' | 'revoked';
  completedLessonIds: string[];
  enrolledAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface CourseComment {
  id: string;
  courseId: string;
  studentUid: string;
  studentName: string;
  studentAvatarUrl?: string;
  content: string;
  status: CommentStatus;
  adminReply?: string;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface Certificate {
  certificateId: string;
  studentUid?: string;
  studentFullName: string;
  trackId?: string;
  trackName: string;
  instructorId?: string;
  instructorName: string;
  completionDate: string;
  grade?: string;
  status: CertificateStatus;
  revokedReason?: string;
  issuedAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface NotificationItem {
  id: string;
  recipientUid: string;
  type: NotificationType;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  actionUrl?: string;
  phoneNumber?: string;
  googleFormUrl?: string;
  isRead: boolean;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface Announcement {
  id: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  priority: 'normal' | 'important';
  isPublished: boolean;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface Testimonial {
  id: string;
  studentUid?: string;
  studentName: string;
  trackName: string;
  quoteEn: string;
  quoteAr: string;
  isApproved: boolean;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface PaymentRecord {
  id: string;
  studentUid: string;
  studentName: string;
  studentEmail?: string;
  trackId: string;
  trackTitle: string;
  totalFee: number;
  amountPaid: number;
  currency: 'EGP';
  paymentMethod: string;
  status: PaymentStatus;
  paymentDate: string;
  notes?: string;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
}

export interface AcademySettings {
  id: string;
  academyName: string;
  logoUrl?: string;
  contactPhone: string;
  contactEmail: string;
  defaultLanguage: Language;
  applicationsOpen: boolean;
  heroHeadlineEn?: string;
  heroHeadlineAr?: string;
  heroSubtitleEn?: string;
  heroSubtitleAr?: string;
  aboutTitleEn?: string;
  aboutTitleAr?: string;
  aboutBodyEn?: string;
  aboutBodyAr?: string;
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    github?: string;
    whatsapp?: string;
  };
  updatedAt?: FirestoreTimestampLike;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  createdAt?: FirestoreTimestampLike;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'resolved';
  createdAt?: FirestoreTimestampLike;
}
