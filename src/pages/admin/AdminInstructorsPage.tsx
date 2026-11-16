import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, Upload, X } from 'lucide-react';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SafeImage } from '../../components/common/SafeImage';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { generateId, slugify } from '../../lib/validation';
import {
  adminDeleteInstructor,
  adminGetAllCollections,
  adminSaveInstructor,
  uploadImageToStorage,
} from '../../services/firestoreService';
import type { Course, Instructor, LearningTrack } from '../../types';

export const AdminInstructorsPage: React.FC = () => {
  const { user, isFirebaseAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Instructor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Instructor | null>(null);

  const [form, setForm] = useState({
    nameEn: '',
    nameAr: '',
    specializationEn: '',
    specializationAr: '',
    bioEn: '',
    bioAr: '',
    avatarUrl: '',
    isActive: true,
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
      setInstructors(data.instructors);
      setTracks(data.tracks);
      setCourses(data.courses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isFirebaseAdmin]);

  const openNew = () => {
    setEditing(null);
    setForm({
      nameEn: '',
      nameAr: '',
      specializationEn: '',
      specializationAr: '',
      bioEn: '',
      bioAr: '',
      avatarUrl: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (inst: Instructor) => {
    setEditing(inst);
    setForm({
      nameEn: inst.nameEn,
      nameAr: inst.nameAr,
      specializationEn: inst.specializationEn,
      specializationAr: inst.specializationAr,
      bioEn: inst.bioEn || '',
      bioAr: inst.bioAr || '',
      avatarUrl: inst.avatarUrl || '',
      isActive: inst.isActive,
    });
    setModalOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageToStorage(file, `academy/instructors/${Date.now()}_${file.name}`);
      setForm((prev) => ({ ...prev, avatarUrl: url }));
      showToast('Portrait uploaded.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const id = editing?.id || slugify(form.nameEn) || generateId('inst');
      await adminSaveInstructor(
        {
          id,
          nameEn: form.nameEn.trim(),
          nameAr: form.nameAr.trim(),
          specializationEn: form.specializationEn.trim(),
          specializationAr: form.specializationAr.trim(),
          bioEn: form.bioEn.trim(),
          bioAr: form.bioAr.trim(),
          avatarUrl: form.avatarUrl.trim(),
          isActive: form.isActive,
        },
        !editing,
        user?.email || 'admin'
      );
      showToast(editing ? 'Instructor updated.' : 'Instructor added.', 'success');
      setModalOpen(false);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save instructor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminDeleteInstructor(deleteTarget.id, user?.email || 'admin');
      showToast('Instructor removed.', 'success');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold">{t.admin.instructors}</h2>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Instructor</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-white dark:bg-[#0D1121] animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {instructors.map((inst) => {
            const ledTracks = tracks.filter((tr) => tr.instructorId === inst.id);
            const ledCourses = courses.filter((c) => c.instructorId === inst.id);
            return (
              <div
                key={inst.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 flex flex-col space-y-4"
              >
                <div className="flex items-center gap-3.5">
                  <SafeImage
                    src={inst.avatarUrl}
                    alt={inst.nameEn}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0"
                    fallbackLabel={inst.nameEn}
                  />
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold truncate">
                      {language === 'ar' ? inst.nameAr : inst.nameEn}
                    </h3>
                    <p className="text-xs text-violet-600 dark:text-violet-400 truncate">
                      {language === 'ar' ? inst.specializationAr : inst.specializationEn}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 flex-1">
                  {language === 'ar' ? inst.bioAr : inst.bioEn}
                </p>
                <div className="text-xs text-slate-500 font-mono-tabular">
                  {ledTracks.length} Tracks · {ledCourses.length} Courses
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(inst)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{t.common.edit}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(inst)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-500 text-xs font-semibold hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.common.delete}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">
                {editing ? 'Edit Instructor' : 'Add Instructor'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Full Name (EN)</label>
                  <input
                    type="text"
                    required
                    value={form.nameEn}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Full Name (AR)</label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={form.nameAr}
                    onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Specialization (EN)</label>
                  <input
                    type="text"
                    required
                    value={form.specializationEn}
                    onChange={(e) => setForm({ ...form, specializationEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Specialization (AR)</label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={form.specializationAr}
                    onChange={(e) => setForm({ ...form, specializationAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Bio (EN)</label>
                  <textarea
                    rows={3}
                    value={form.bioEn}
                    onChange={(e) => setForm({ ...form, bioEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Bio (AR)</label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={form.bioAr}
                    onChange={(e) => setForm({ ...form, bioAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Profile Photo URL or Upload</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.avatarUrl}
                    onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? '...' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
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
        open={Boolean(deleteTarget)}
        title="Delete Instructor?"
        description={`Remove ${deleteTarget?.nameEn} from the academy faculty list?`}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
