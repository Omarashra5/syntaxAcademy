import React, { useEffect, useState } from 'react';
import { ExternalLink, Phone, Plus, Send, X } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { applicationSchema, formatFirestoreDate } from '../../lib/validation';
import {
  getPublishedTracks,
  getStudentApplications,
  submitTrackApplication,
} from '../../services/firestoreService';
import type { Application, LearningTrack } from '../../types';

export const StudentApplicationsPage: React.FC = () => {
  const { user, studentProfile } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    trackId: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [apps, trs] = await Promise.all([
        getStudentApplications(user.uid),
        getPublishedTracks(),
      ]);
      setApplications(apps);
      setTracks(trs);
      if (trs.length > 0 && !form.trackId) {
        setForm((prev) => ({ ...prev, trackId: trs[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      studentName: studentProfile?.fullName || user?.displayName || prev.studentName,
      studentEmail: studentProfile?.email || user?.email || prev.studentEmail,
      studentPhone: studentProfile?.phone || prev.studentPhone,
    }));
  }, [studentProfile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const selectedTrack = tracks.find((tr) => tr.id === form.trackId);
    if (!selectedTrack) {
      showToast('Please select a learning track.', 'error');
      return;
    }

    const parsed = applicationSchema.safeParse(form);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || 'Check your input fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await submitTrackApplication({
        studentUid: user.uid,
        studentName: parsed.data.studentName,
        studentEmail: parsed.data.studentEmail,
        studentPhone: parsed.data.studentPhone,
        track: selectedTrack,
        message: parsed.data.message,
      });
      showToast(t.application.submittedSuccess, 'success');
      setModalOpen(false);
      setForm((prev) => ({ ...prev, message: '' }));
      await loadData();
    } catch (err) {
      if (err instanceof Error && err.message === 'DUPLICATE_PENDING_APPLICATION') {
        showToast(t.application.duplicateWarning, 'error');
      } else {
        showToast(err instanceof Error ? err.message : 'Failed to submit application.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold">{t.student.applications}</h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.application.formTitle}</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] animate-pulse"
            />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-10 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {t.student.noApplications}
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold"
          >
            {t.tracks.applyNow}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const trackTitle = language === 'ar' ? app.trackTitleAr : app.trackTitleEn;
            return (
              <div
                key={app.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-bold">{trackTitle}</h3>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular flex flex-wrap items-center gap-2">
                      <span>{formatFirestoreDate(app.createdAt, language)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{app.studentPhone}</span>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                {app.message && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {app.message}
                  </p>
                )}

                {app.adminMessage && (
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#070912] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold block mb-1">
                      {language === 'ar' ? 'رد الإدارة:' : 'Admissions Response:'}
                    </span>
                    {app.adminMessage}
                  </div>
                )}

                {app.status === 'accepted' && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      {language === 'ar'
                        ? `تهانينا! تم قبول طلبك للالتحاق بمسار ${trackTitle} في Syntax Academy. يرجى التواصل معنا على 01012329975 لاستلام نموذج Google Form لإتمام التسجيل.`
                        : `Congratulations! Your application for ${trackTitle} at Syntax Academy has been accepted. Please contact us at 01012329975 to receive the Google Form required to complete your registration.`}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href="tel:01012329975"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>01012329975</span>
                      </a>
                      {app.googleFormUrl && (
                        <a
                          href={app.googleFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{t.application.openGoogleForm}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">{t.application.formTitle}</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {t.application.selectTrack}
                </label>
                <select
                  required
                  value={form.trackId}
                  onChange={(e) => setForm({ ...form, trackId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                >
                  {tracks
                    .filter((tr) => tr.applicationsOpen)
                    .map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {language === 'ar' ? tr.titleAr : tr.titleEn} ({tr.discountedPrice} EGP)
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {t.application.fullName}
                </label>
                <input
                  type="text"
                  required
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    {t.application.email}
                  </label>
                  <input
                    type="email"
                    required
                    value={form.studentEmail}
                    onChange={(e) => setForm({ ...form, studentEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    {t.application.phone}
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.studentPhone}
                    onChange={(e) => setForm({ ...form, studentPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {t.application.message}
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? t.application.submitting : t.application.submit}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
