import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, Search, UserCheck, X, XCircle } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { formatFirestoreDate } from '../../lib/validation';
import {
  adminGetAllCollections,
  adminUpdateApplicationStatus,
  getAcademySettings,
} from '../../services/firestoreService';
import type { AcademySettings, Application, ApplicationStatus, LearningTrack } from '../../types';

export const AdminApplicationsPage: React.FC = () => {
  const { user, isFirebaseAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [settings, setSettings] = useState<AcademySettings | null>(null);

  const [search, setSearch] = useState('');
  const [trackFilter, setTrackFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selected, setSelected] = useState<Application | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    if (!isFirebaseAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [data, cfg] = await Promise.all([adminGetAllCollections(), getAcademySettings()]);
      setApplications(data.applications);
      setTracks(data.tracks);
      setSettings(cfg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isFirebaseAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      if (trackFilter !== 'all' && a.trackId !== trackFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (q) {
        return (
          a.studentName.toLowerCase().includes(q) ||
          a.studentEmail.toLowerCase().includes(q) ||
          a.studentPhone.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [applications, search, trackFilter, statusFilter]);

  const openReview = (app: Application) => {
    setSelected(app);
    setAdminMessage(app.adminMessage || '');
    setInternalNote(app.internalNote || '');
  };

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const track = tracks.find((tr) => tr.id === selected.trackId);
      await adminUpdateApplicationStatus({
        application: selected,
        newStatus,
        adminMessage,
        internalNote,
        trackGoogleFormUrl: track?.googleFormUrl || '',
        contactPhone: settings?.contactPhone || '01012329975',
        actor: user?.email || 'admin',
      });
      showToast(`Application updated to ${newStatus}.`, 'success');
      setSelected(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update application.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">{t.admin.applications}</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.common.search}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] text-sm"
          />
        </div>
        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] text-sm"
        >
          <option value="all">{t.common.all} Tracks</option>
          {tracks.map((tr) => (
            <option key={tr.id} value={tr.id}>
              {language === 'ar' ? tr.titleAr : tr.titleEn}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] text-sm"
        >
          <option value="all">{t.common.all} Statuses</option>
          <option value="pending">{t.statuses.pending}</option>
          <option value="under_review">{t.statuses.under_review}</option>
          <option value="accepted">{t.statuses.accepted}</option>
          <option value="enrolled">{t.statuses.enrolled}</option>
          <option value="rejected">{t.statuses.rejected}</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] overflow-x-auto">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <th className="py-3.5 px-4 text-start font-semibold">Student</th>
              <th className="py-3.5 px-4 text-start font-semibold">Phone</th>
              <th className="py-3.5 px-4 text-start font-semibold">Track</th>
              <th className="py-3.5 px-4 text-start font-semibold">Date</th>
              <th className="py-3.5 px-4 text-start font-semibold">Status</th>
              <th className="py-3.5 px-4 text-end font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  {t.common.loading}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No applications match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <div className="font-semibold">{app.studentName}</div>
                    <div className="text-xs text-slate-500">{app.studentEmail}</div>
                  </td>
                  <td className="py-3 px-4 font-mono-tabular text-xs">{app.studentPhone}</td>
                  <td className="py-3 px-4">
                    {language === 'ar' ? app.trackTitleAr : app.trackTitleEn}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono-tabular text-slate-500">
                    {formatFirestoreDate(app.createdAt, language)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button
                      type="button"
                      onClick={() => openReview(app)}
                      className="px-3 py-1.5 rounded-lg bg-violet-600/10 text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white text-xs font-semibold transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold">{selected.studentName}</h3>
                <p className="text-xs text-slate-500">
                  {selected.studentEmail} · {selected.studentPhone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070912] border border-slate-200 dark:border-slate-800 space-y-1 text-sm">
              <div className="text-xs text-slate-500">Requested Track</div>
              <div className="font-semibold">
                {language === 'ar' ? selected.trackTitleAr : selected.trackTitleEn}
              </div>
              {selected.message && (
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  "{selected.message}"
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                {t.admin.studentMessage}
              </label>
              <textarea
                rows={2}
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                {t.admin.internalNote}
              </label>
              <textarea
                rows={2}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                disabled={updating}
                onClick={() => handleStatusChange('under_review')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-sky-500/40 text-sky-600 dark:text-sky-400 text-xs font-semibold hover:bg-sky-500/10"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t.admin.reviewApp}</span>
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleStatusChange('accepted')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.admin.acceptApp}</span>
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleStatusChange('enrolled')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{t.admin.enrollApp}</span>
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleStatusChange('rejected')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{t.admin.rejectApp}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
