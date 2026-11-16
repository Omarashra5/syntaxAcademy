import React, { useEffect, useState } from 'react';
import { Archive, Edit2, Plus, RotateCcw, Upload, X } from 'lucide-react';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SafeImage } from '../../components/common/SafeImage';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrencyEgp, generateId, slugify } from '../../lib/validation';
import {
  adminArchiveTrack,
  adminGetAllCollections,
  adminSaveTrack,
  uploadImageToStorage,
} from '../../services/firestoreService';
import type { Instructor, LearningTrack, TrackCategory } from '../../types';

export const AdminTracksPage: React.FC = () => {
  const { user, isFirebaseAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<LearningTrack | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<LearningTrack | null>(null);

  const [form, setForm] = useState({
    titleEn: '',
    titleAr: '',
    category: 'programming' as TrackCategory,
    descriptionEn: '',
    descriptionAr: '',
    originalPrice: 3000,
    discountedPrice: 2500,
    durationEn: '12 Weeks · Practical Labs',
    durationAr: '12 أسبوعًا · تطبيقات عملية',
    instructorId: '',
    thumbnailUrl: '',
    skillsText: '',
    objectivesEnText: '',
    objectivesArText: '',
    technologiesText: '',
    googleFormUrl: '',
    isPublished: true,
    applicationsOpen: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!isFirebaseAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await adminGetAllCollections();
      setTracks(data.tracks);
      setInstructors(data.instructors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isFirebaseAdmin]);

  const openNew = () => {
    setEditingTrack(null);
    setForm({
      titleEn: '',
      titleAr: '',
      category: 'programming',
      descriptionEn: '',
      descriptionAr: '',
      originalPrice: 2000,
      discountedPrice: 1500,
      durationEn: '8 Weeks · Live Labs',
      durationAr: '8 أسابيع · تطبيقات مباشرة',
      instructorId: instructors[0]?.id || 'omar-ashraf',
      thumbnailUrl: '',
      skillsText: '',
      objectivesEnText: '',
      objectivesArText: '',
      technologiesText: '',
      googleFormUrl: '',
      isPublished: true,
      applicationsOpen: true,
    });
    setModalOpen(true);
  };

  const openEdit = (track: LearningTrack) => {
    setEditingTrack(track);
    setForm({
      titleEn: track.titleEn,
      titleAr: track.titleAr,
      category: track.category,
      descriptionEn: track.descriptionEn,
      descriptionAr: track.descriptionAr,
      originalPrice: track.originalPrice,
      discountedPrice: track.discountedPrice,
      durationEn: track.durationEn || '',
      durationAr: track.durationAr || '',
      instructorId: track.instructorId,
      thumbnailUrl: track.thumbnailUrl || '',
      skillsText: (track.skills || []).join(', '),
      objectivesEnText: (track.objectivesEn || []).join('\n'),
      objectivesArText: (track.objectivesAr || []).join('\n'),
      technologiesText: (track.technologies || []).join(', '),
      googleFormUrl: track.googleFormUrl || '',
      isPublished: track.isPublished,
      applicationsOpen: track.applicationsOpen,
    });
    setModalOpen(true);
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageToStorage(file, `academy/tracks/${Date.now()}_${file.name}`);
      setForm((prev) => ({ ...prev, thumbnailUrl: url }));
      showToast('Thumbnail uploaded.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn.trim() || !form.titleAr.trim()) {
      showToast('Track titles (EN & AR) are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const id = editingTrack?.id || slugify(form.titleEn) || generateId('trk');
      const slug = editingTrack?.slug || slugify(form.titleEn) || id;
      const splitCsv = (s: string) =>
        s
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 20);
      const splitLines = (s: string) =>
        s
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 20);

      await adminSaveTrack(
        {
          id,
          slug,
          category: form.category,
          titleEn: form.titleEn.trim(),
          titleAr: form.titleAr.trim(),
          descriptionEn: form.descriptionEn.trim(),
          descriptionAr: form.descriptionAr.trim(),
          thumbnailUrl: form.thumbnailUrl.trim(),
          originalPrice: Number(form.originalPrice),
          discountedPrice: Number(form.discountedPrice),
          durationEn: form.durationEn.trim(),
          durationAr: form.durationAr.trim(),
          instructorId: form.instructorId,
          skills: splitCsv(form.skillsText),
          objectivesEn: splitLines(form.objectivesEnText),
          objectivesAr: splitLines(form.objectivesArText),
          technologies: splitCsv(form.technologiesText),
          curriculum: editingTrack?.curriculum || [],
          faqs: editingTrack?.faqs || [],
          googleFormUrl: form.googleFormUrl.trim(),
          isPublished: form.isPublished,
          applicationsOpen: form.applicationsOpen,
          isArchived: editingTrack?.isArchived || false,
        },
        !editingTrack,
        user?.email || 'admin'
      );
      showToast(editingTrack ? 'Track updated.' : 'Track created.', 'success');
      setModalOpen(false);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save track.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      await adminArchiveTrack(archiveTarget.id, !archiveTarget.isArchived, user?.email || 'admin');
      showToast(
        archiveTarget.isArchived ? 'Track restored.' : 'Track safely archived.',
        'success'
      );
      setArchiveTarget(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Operation failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold">{t.admin.tracks}</h2>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Learning Track / Program</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-white dark:bg-[#0D1121] animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tracks.map((tr) => (
            <div
              key={tr.id}
              className={`rounded-2xl border bg-white dark:bg-[#0D1121] overflow-hidden flex flex-col ${
                tr.isArchived
                  ? 'border-amber-500/40 opacity-75'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="aspect-[16/9] bg-slate-900">
                <SafeImage
                  src={tr.thumbnailUrl}
                  alt={tr.titleEn}
                  className="w-full h-full object-cover"
                  fallbackLabel={tr.titleEn}
                />
              </div>
              <div className="p-5 flex-1 flex flex-col space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="uppercase font-semibold">{tr.category}</span>
                  <span>
                    {tr.isArchived
                      ? 'Archived'
                      : tr.isPublished
                        ? 'Published'
                        : 'Draft'}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold">
                  {language === 'ar' ? tr.titleAr : tr.titleEn}
                </h3>
                <div className="flex items-baseline gap-2 font-mono-tabular">
                  <span className="text-lg font-bold">{formatCurrencyEgp(tr.discountedPrice, language)}</span>
                  <span className="text-xs line-through text-slate-400">
                    {formatCurrencyEgp(tr.originalPrice, language)}
                  </span>
                </div>
                {tr.googleFormUrl && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                    Google Form configured
                  </p>
                )}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 mt-auto">
                  <button
                    type="button"
                    onClick={() => openEdit(tr)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{t.common.edit}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchiveTarget(tr)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/10"
                  >
                    {tr.isArchived ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-3xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold">
                {editingTrack ? 'Edit Learning Track' : 'Create Learning Track / Program'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Title (English)</label>
                  <input
                    type="text"
                    required
                    value={form.titleEn}
                    onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Title (Arabic)</label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={form.titleAr}
                    onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as TrackCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  >
                    <option value="programming">Programming</option>
                    <option value="office">Microsoft Office</option>
                    <option value="language">Language Course</option>
                    <option value="program">Educational Program</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Original Price (EGP)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Discounted Price (EGP)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.discountedPrice}
                    onChange={(e) => setForm({ ...form, discountedPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm font-mono-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Description (English)</label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    value={form.descriptionEn}
                    onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Description (Arabic)</label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    dir="rtl"
                    value={form.descriptionAr}
                    onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Instructor</label>
                  <select
                    value={form.instructorId}
                    onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  >
                    {instructors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Duration (EN)</label>
                  <input
                    type="text"
                    value={form.durationEn}
                    onChange={(e) => setForm({ ...form, durationEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Duration (AR)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={form.durationAr}
                    onChange={(e) => setForm({ ...form, durationAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Google Forms URL (shown to accepted students)
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/forms/..."
                  value={form.googleFormUrl}
                  onChange={(e) => setForm({ ...form, googleFormUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Thumbnail URL or Upload</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.thumbnailUrl}
                    onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? '...' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={handleThumbUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={form.skillsText}
                    onChange={(e) => setForm({ ...form, skillsText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Technologies (comma separated)</label>
                  <input
                    type="text"
                    value={form.technologiesText}
                    onChange={(e) => setForm({ ...form, technologiesText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Objectives EN (1 per line)</label>
                  <textarea
                    rows={3}
                    value={form.objectivesEnText}
                    onChange={(e) => setForm({ ...form, objectivesEnText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Objectives AR (1 per line)</label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={form.objectivesArText}
                    onChange={(e) => setForm({ ...form, objectivesArText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  />
                  <span>Publicly Visible (Published)</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={form.applicationsOpen}
                    onChange={(e) => setForm({ ...form, applicationsOpen: e.target.checked })}
                  />
                  <span>Accepting Applications</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-60"
                >
                  {saving ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title={archiveTarget?.isArchived ? 'Restore Learning Track?' : 'Archive Learning Track?'}
        description="Archiving hides this track from public listings while preserving all existing student applications, enrollments, and issued certificates."
        confirmLabel={archiveTarget?.isArchived ? 'Restore' : 'Archive'}
        cancelLabel={t.common.cancel}
        variant={archiveTarget?.isArchived ? 'primary' : 'danger'}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
};
