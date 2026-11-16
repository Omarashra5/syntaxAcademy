import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  MessageSquare,
  Play,
  Send,
} from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { SafeImage } from '../../components/common/SafeImage';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import {
  commentSchema,
  extractYouTubeEmbedUrl,
  formatFirestoreDate,
} from '../../lib/validation';
import { validateCommentServer } from '../../services/adminApiService';
import {
  getCourseById,
  getCourseComments,
  getCourseLessons,
  getStudentEnrollments,
  postCourseComment,
  toggleLessonCompletion,
} from '../../services/firestoreService';
import type { Course, CourseComment, Enrollment, Lesson } from '../../types';

export const CoursePlayerPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, studentProfile, isFirebaseAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    (async () => {
      try {
        const courseDoc = await getCourseById(courseId);
        setCourse(courseDoc);
        if (!courseDoc) return;

        let activeEnroll: Enrollment | null = null;
        if (user) {
          const enrolls = await getStudentEnrollments(user.uid);
          activeEnroll =
            enrolls.find(
              (e) => e.trackId === courseDoc.trackId && (e.status === 'active' || e.status === 'completed')
            ) || null;
          setEnrollment(activeEnroll);
        }

        const hasFullAccess =
          isFirebaseAdmin || Boolean(activeEnroll) || courseDoc.isPublicPreview;
        const [lessonsData, commentsData] = await Promise.all([
          getCourseLessons(courseId, hasFullAccess),
          getCourseComments(courseId, isFirebaseAdmin),
        ]);
        setLessons(lessonsData);
        setActiveLesson(lessonsData[0] || null);
        setComments(commentsData);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, user, isFirebaseAdmin]);

  const completedIds = enrollment?.completedLessonIds || [];
  const progressPercent = useMemo(() => {
    if (lessons.length === 0) return 0;
    const completed = lessons.filter((l) => completedIds.includes(l.id)).length;
    return Math.round((completed / lessons.length) * 100);
  }, [lessons, completedIds]);

  const handleToggleComplete = async (lessonId: string) => {
    if (!enrollment) return;
    try {
      const nextIds = await toggleLessonCompletion(enrollment.id, lessonId, completedIds);
      setEnrollment({ ...enrollment, completedLessonIds: nextIds });
      showToast(
        nextIds.includes(lessonId)
          ? language === 'ar'
            ? 'تم تحديد الدرس كمكتمل.'
            : 'Lesson marked as completed.'
          : language === 'ar'
            ? 'تمت إزالة علامة الاكتمال.'
            : 'Lesson completion updated.',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update progress.', 'error');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !course) return;
    const parsed = commentSchema.safeParse({ content: commentText });
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || 'Comment is too short.', 'error');
      return;
    }

    setPostingComment(true);
    try {
      const sanitized = await validateCommentServer(parsed.data.content);
      const created = await postCourseComment({
        courseId: course.id,
        courseTitle: language === 'ar' ? course.titleAr : course.titleEn,
        studentUid: user.uid,
        studentName: studentProfile?.fullName || user.displayName || 'Student',
        studentAvatarUrl: studentProfile?.avatarUrl || user.photoURL || '',
        content: sanitized,
      });
      setComments((prev) => [created, ...prev]);
      setCommentText('');
      showToast(
        language === 'ar' ? 'تم نشر تعليقك بنجاح.' : 'Comment posted.',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to post comment.', 'error');
    } finally {
      setPostingComment(false);
    }
  };

  const embedUrl = extractYouTubeEmbedUrl(activeLesson?.videoUrl || course?.previewVideoUrl);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070912] text-slate-900 dark:text-slate-100">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <Link
          to={user ? '/dashboard/courses' : '/'}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-violet-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{user ? t.student.courses : t.common.backHome}</span>
        </Link>

        {loading ? (
          <div className="h-96 rounded-2xl bg-white dark:bg-[#0D1121] border border-slate-200 dark:border-slate-800 animate-pulse" />
        ) : !course ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-10 text-center">
            <p className="text-sm text-slate-500">Course not found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 columns: Video Player + Lesson Details + Comments */}
            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-black overflow-hidden aspect-video">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={activeLesson ? activeLesson.titleEn : course.titleEn}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                    <Lock className="w-8 h-8 mb-3 text-violet-400" />
                    <p className="text-sm max-w-md">{t.courses.lockedLesson}</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold">
                      {activeLesson
                        ? language === 'ar'
                          ? activeLesson.titleAr
                          : activeLesson.titleEn
                        : language === 'ar'
                          ? course.titleAr
                          : course.titleEn}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeLesson
                        ? language === 'ar'
                          ? activeLesson.descriptionAr
                          : activeLesson.descriptionEn
                        : language === 'ar'
                          ? course.descriptionAr
                          : course.descriptionEn}
                    </p>
                  </div>

                  {activeLesson && enrollment && (
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(activeLesson.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                        completedIds.includes(activeLesson.id)
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 dark:border-slate-700 hover:border-violet-500'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {completedIds.includes(activeLesson.id)
                          ? t.courses.completed
                          : t.courses.markComplete}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-violet-500" />
                  <h2 className="font-display text-lg font-bold">{t.courses.commentsTitle}</h2>
                </div>

                {user ? (
                  <form onSubmit={handlePostComment} className="space-y-3">
                    <textarea
                      rows={3}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={t.courses.commentPlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                    />
                    <button
                      type="submit"
                      disabled={postingComment}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{postingComment ? t.common.loading : t.courses.postComment}</span>
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-slate-500">
                    <Link to="/login" className="text-violet-500 font-semibold underline">
                      {t.nav.login}
                    </Link>{' '}
                    to join the course discussion.
                  </p>
                )}

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {comments.length === 0 ? (
                    <p className="text-sm text-slate-500 py-2">No comments yet.</p>
                  ) : (
                    comments.map((cmt) => (
                      <div key={cmt.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={cmt.studentAvatarUrl}
                            alt={cmt.studentName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-sm font-semibold">{cmt.studentName}</div>
                            <div className="text-[11px] text-slate-400 font-mono-tabular">
                              {formatFirestoreDate(cmt.createdAt, language)}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {cmt.content}
                        </p>
                        {cmt.adminReply && (
                          <div className="ms-6 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs">
                            <span className="font-semibold text-violet-600 dark:text-violet-400 block mb-1">
                              {t.courses.adminReply}
                            </span>
                            <p className="text-slate-700 dark:text-slate-300">{cmt.adminReply}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right 4 columns: Curriculum Lessons Sidebar & Progress */}
            <aside className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5 space-y-5">
              <div>
                <h2 className="font-display text-base font-bold">
                  {language === 'ar' ? course.titleAr : course.titleEn}
                </h2>
                {enrollment && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">{t.courses.progress}</span>
                      <span className="font-mono-tabular font-semibold">{progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-violet-600 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {lessons.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">{t.courses.lockedLesson}</p>
                ) : (
                  lessons.map((lesson, idx) => {
                    const isSelected = activeLesson?.id === lesson.id;
                    const isDone = completedIds.includes(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full text-start py-3 px-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                          isSelected
                            ? 'bg-violet-600/10 text-violet-700 dark:text-violet-300'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : isSelected ? (
                            <Play className="w-4 h-4 text-violet-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-400">
                            {language === 'ar'
                              ? lesson.sectionTitleAr || `الدرس ${idx + 1}`
                              : lesson.sectionTitleEn || `Lesson ${idx + 1}`}
                          </div>
                          <div className="text-sm font-semibold truncate">
                            {language === 'ar' ? lesson.titleAr : lesson.titleEn}
                          </div>
                          {lesson.durationMinutes && (
                            <div className="text-[11px] text-slate-400 font-mono-tabular mt-0.5">
                              {lesson.durationMinutes} min
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};
