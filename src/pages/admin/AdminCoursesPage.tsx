import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Edit2,
  EyeOff,
  MessageSquare,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { formatFirestoreDate, generateId } from '../../lib/validation';
import {
  adminDeleteComment,
  adminDeleteLesson,
  adminGetAllCollections,
  adminModerateComment,
  adminSaveCourse,
  adminSaveLesson,
  getCourseLessons,
  uploadImageToStorage,
} from '../../services/firestoreService';
import type { Course, CourseComment, Instructor, LearningTrack, Lesson } from '../../types';

export const AdminCoursesPage: React.FC = () => {
  const { user, isFirebaseAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'courses' | 'comments'>('courses');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [comments, setComments] = useState<CourseComment[]>([]);

  // Course Modal
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    trackId: '',
    instructorId: '',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    thumbnailUrl: '',
    previewVideoUrl: '',
    isPublished: true,
    isPublicPreview: false,
    isArchived: false,
  });

  // Lessons Manager Modal
  const [lessonsCourse, setLessonsCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonForm, setLessonForm] = useState({
    sectionTitleEn: 'Section 1',
    sectionTitleAr: 'القسم 1',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    videoUrl: '',
    durationMinutes: 20,
    orderIndex: 1,
    isFreePreview: false,
  });

  // Comment Reply State
  const [replyTarget, setReplyTarget] = useState<CourseComment | null>(null);
  const [replyText, setReplyText] = useState('');

  const load = async () => {
    if (!isFirebaseAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await adminGetAllCollections();
      setCourses(data.courses);
      setTracks(data.tracks);
      setInstructors(data.instructors);
      setComments(data.comments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isFirebaseAdmin]);

  const openNewCourse = () => {
    setEditingCourse(null);
    setCourseForm({
      trackId: tracks[0]?.id || '',
      instructorId: instructors[0]?.id || '',
      titleEn: '',
      titleAr: '',
      descriptionEn: '',
      descriptionAr: '',
      thumbnailUrl: '',
      previewVideoUrl: '',
      isPublished: true,
      isPublicPreview: false,
      isArchived: false,
    });
    setCourseModalOpen(true);
  };

  const openEditCourse = (c: Course) => {
    setEditingCourse(c);
    setCourseForm({
      trackId: c.trackId,
      instructorId: c.instructorId,
      titleEn: c.titleEn,
      titleAr: c.titleAr,
      descriptionEn: c.descriptionEn || '',
      descriptionAr: c.descriptionAr || '',
      thumbnailUrl: c.thumbnailUrl || '',
      previewVideoUrl: c.previewVideoUrl || '',
      isPublished: c.isPublished,
      isPublicPreview: c.isPublicPreview,
      isArchived: c.isArchived,
    });
    setCourseModalOpen(true);
  };

  const handleCourseThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageToStorage(file, `academy/courses/${Date.now()}_${file.name}`);
      setCourseForm((prev) => ({ ...prev, thumbnailUrl: url }));
      showToast('Course thumbnail uploaded.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.', 'error');
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = editingCourse?.id || generateId('crs');
      await adminSaveCourse(
        {
          id,
          ...courseForm,
          titleEn: courseForm.titleEn.trim(),
          titleAr: courseForm.titleAr.trim(),
        },
        !editingCourse,
        user?.email || 'admin'
      );
      showToast(editingCourse ? 'Course updated.' : 'Course created.', 'success');
      setCourseModalOpen(false);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save course.', 'error');
    }
  };

  const openLessonsManager = async (course: Course) => {
    setLessonsCourse(course);
    const list = await getCourseLessons(course.id, true);
    setLessons(list);
    setLessonForm((prev) => ({ ...prev, orderIndex: list.length + 1 }));
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonsCourse) return;
    try {
      const id = generateId('lsn');
      await adminSaveLesson(
        {
          id,
          courseId: lessonsCourse.id,
          ...lessonForm,
          titleEn: lessonForm.titleEn.trim(),
          titleAr: lessonForm.titleAr.trim(),
        },
        true
      );
      const updated = await getCourseLessons(lessonsCourse.id, true);
      setLessons(updated);
      setLessonForm({
        sectionTitleEn: 'Section 1',
        sectionTitleAr: 'القسم 1',
        titleEn: '',
        titleAr: '',
        descriptionEn: '',
        descriptionAr: '',
        videoUrl: '',
        durationMinutes: 20,
        orderIndex: updated.length + 1,
        isFreePreview: false,
      });
      showToast('Lesson added to course.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add lesson.', 'error');
    }
  };

  const handleRemoveLesson = async (lessonId: string) => {
    if (!lessonsCourse) return;
    await adminDeleteLesson(lessonsCourse.id, lessonId);
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    showToast('Lesson removed.', 'success');
  };

  const handleModerate = async (commentId: string, status: 'approved' | 'hidden') => {
    await adminModerateComment(commentId, { status }, user?.email || 'admin');
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, status } : c)));
    showToast(`Comment marked as ${status}.`, 'success');
  };

  const handleSaveReply = async () => {
    if (!replyTarget) return;
    await adminModerateComment(
      replyTarget.id,
      { adminReply: replyText.trim(), status: 'approved' },
      user?.email || 'admin'
    );
    setComments((prev) =>
      prev.map((c) =>
        c.id === replyTarget.id ? { ...c, adminReply: replyText.trim(), status: 'approved' } : c
      )
    );
    setReplyTarget(null);
    setReplyText('');
    showToast('Reply saved.', 'success');
  };

  const handleDeleteComment = async (id: string) => {
    await adminDeleteComment(id, user?.email || 'admin');
    setComments((prev) => prev.filter((c) => c.id !== id));
    showToast('Comment deleted.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0D1121] border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTab('courses')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold ${
              tab === 'courses' ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Courses & Lessons ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('comments')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold ${
              tab === 'comments' ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Comment Moderation ({comments.length})
          </button>
        </div>

        {tab === 'courses' && (
          <button
            type="button"
            onClick={openNewCourse}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Create Course</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-white dark:bg-[#0D1121] animate-pulse" />
      ) : tab === 'courses' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => {
            const tr = tracks.find((x) => x.id === c.trackId);
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5 flex flex-col space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{tr ? (language === 'ar' ? tr.titleAr : tr.titleEn) : c.trackId}</span>
                  <span>
                    {c.isArchived ? 'Archived' : c.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold">
                  {language === 'ar' ? c.titleAr : c.titleEn}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 flex-1">
                  {language === 'ar' ? c.descriptionAr : c.descriptionEn}
                </p>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditCourse(c)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{t.common.edit}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openLessonsManager(c)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Lessons</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] divide-y divide-slate-100 dark:divide-slate-800">
          {comments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No comments submitted yet.</div>
          ) : (
            comments.map((cmt) => (
              <div key={cmt.id} className="p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold">{cmt.studentName}</span>
                    <span className="text-xs text-slate-400 mx-2">·</span>
                    <span className="text-xs font-mono-tabular text-slate-400">
                      {formatFirestoreDate(cmt.createdAt, language)}
                    </span>
                    <span className="text-xs text-slate-400 mx-2">·</span>
                    <span className="text-xs font-semibold uppercase text-violet-500">
                      {cmt.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleModerate(cmt.id, 'approved')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModerate(cmt.id, 'hidden')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTarget(cmt);
                        setReplyText(cmt.adminReply || '');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-semibold"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(cmt.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{cmt.content}</p>
                {cmt.adminReply && (
                  <p className="text-xs text-violet-600 dark:text-violet-400">
                    Admin Reply: {cmt.adminReply}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Course Create/Edit Modal */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">
                {editingCourse ? 'Edit Course' : 'Create Course'}
              </h3>
              <button type="button" onClick={() => setCourseModalOpen(false)} className="p-1.5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Track</label>
                  <select
                    required
                    value={courseForm.trackId}
                    onChange={(e) => setCourseForm({ ...courseForm, trackId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  >
                    {tracks.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.titleEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Instructor</label>
                  <select
                    required
                    value={courseForm.instructorId}
                    onChange={(e) => setCourseForm({ ...courseForm, instructorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  >
                    {instructors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Title (EN)</label>
                  <input
                    type="text"
                    required
                    value={courseForm.titleEn}
                    onChange={(e) => setCourseForm({ ...courseForm, titleEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Title (AR)</label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={courseForm.titleAr}
                    onChange={(e) => setCourseForm({ ...courseForm, titleAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Description (EN)</label>
                  <textarea
                    rows={3}
                    value={courseForm.descriptionEn}
                    onChange={(e) => setCourseForm({ ...courseForm, descriptionEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Description (AR)</label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={courseForm.descriptionAr}
                    onChange={(e) => setCourseForm({ ...courseForm, descriptionAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Preview Video URL (YouTube)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={courseForm.previewVideoUrl}
                  onChange={(e) => setCourseForm({ ...courseForm, previewVideoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Thumbnail URL or Upload</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={courseForm.thumbnailUrl}
                    onChange={(e) => setCourseForm({ ...courseForm, thumbnailUrl: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleCourseThumbUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2 text-xs font-semibold">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={courseForm.isPublished}
                    onChange={(e) => setCourseForm({ ...courseForm, isPublished: e.target.checked })}
                  />
                  <span>Published</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={courseForm.isPublicPreview}
                    onChange={(e) => setCourseForm({ ...courseForm, isPublicPreview: e.target.checked })}
                  />
                  <span>Public Preview Course</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={courseForm.isArchived}
                    onChange={(e) => setCourseForm({ ...courseForm, isArchived: e.target.checked })}
                  />
                  <span>Archived</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lessons Manager Modal */}
      {lessonsCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-3xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">
                Lessons — {lessonsCourse.titleEn}
              </h3>
              <button type="button" onClick={() => setLessonsCourse(null)} className="p-1.5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
              {lessons.length === 0 ? (
                <p className="p-4 text-xs text-slate-500">No lessons yet.</p>
              ) : (
                lessons.map((l) => (
                  <div key={l.id} className="p-3.5 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-400">
                        #{l.orderIndex} · {l.sectionTitleEn} · {l.durationMinutes || 0} min
                      </div>
                      <div className="font-semibold">{l.titleEn}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLesson(l.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddLesson} className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold">Add Lesson</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Section Title (EN)"
                  value={lessonForm.sectionTitleEn}
                  onChange={(e) => setLessonForm({ ...lessonForm, sectionTitleEn: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
                <input
                  type="text"
                  dir="rtl"
                  placeholder="Section Title (AR)"
                  value={lessonForm.sectionTitleAr}
                  onChange={(e) => setLessonForm({ ...lessonForm, sectionTitleAr: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="Lesson Title (EN)"
                  value={lessonForm.titleEn}
                  onChange={(e) => setLessonForm({ ...lessonForm, titleEn: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
                <input
                  type="text"
                  required
                  dir="rtl"
                  placeholder="Lesson Title (AR)"
                  value={lessonForm.titleAr}
                  onChange={(e) => setLessonForm({ ...lessonForm, titleAr: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
              </div>
              <input
                type="url"
                required
                placeholder="YouTube Video URL"
                value={lessonForm.videoUrl}
                onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <textarea
                  rows={2}
                  placeholder="Description (EN)"
                  value={lessonForm.descriptionEn}
                  onChange={(e) => setLessonForm({ ...lessonForm, descriptionEn: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
                <textarea
                  rows={2}
                  dir="rtl"
                  placeholder="Description (AR)"
                  value={lessonForm.descriptionAr}
                  onChange={(e) => setLessonForm({ ...lessonForm, descriptionAr: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <label className="inline-flex items-center gap-1.5">
                    <span>Duration (min):</span>
                    <input
                      type="number"
                      min={1}
                      value={lessonForm.durationMinutes}
                      onChange={(e) =>
                        setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })
                      }
                      className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912]"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lessonForm.isFreePreview}
                      onChange={(e) =>
                        setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })
                      }
                    />
                    <span>Free Preview Lesson</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                >
                  Add Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 space-y-4">
            <h3 className="font-display text-base font-bold">Reply to {replyTarget.studentName}</h3>
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveReply}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
              >
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
