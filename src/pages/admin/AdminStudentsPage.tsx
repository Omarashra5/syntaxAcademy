import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShieldAlert, UserCheck, X } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { formatFirestoreDate } from '../../lib/validation';
import { adminGetAllCollections, adminUpdateStudentAccount } from '../../services/firestoreService';
import type { Application, Certificate, StudentUser } from '../../types';

export const AdminStudentsPage: React.FC = () => {
  const { user, isFirebaseAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<StudentUser | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!isFirebaseAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await adminGetAllCollections();
      setStudents(data.students);
      setApplications(data.applications);
      setCertificates(data.certificates);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isFirebaseAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q)
    );
  }, [students, search]);

  const openDetail = (st: StudentUser) => {
    setSelected(st);
    setNotes(st.internalNotes || '');
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminUpdateStudentAccount(
        selected.uid,
        { internalNotes: notes },
        user?.email || 'admin'
      );
      showToast('Student notes saved.', 'success');
      await load();
      setSelected((prev) => (prev ? { ...prev, internalNotes: notes } : null));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save notes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSuspend = async (st: StudentUser) => {
    const nextStatus = st.status === 'active' ? 'suspended' : 'active';
    try {
      await adminUpdateStudentAccount(st.uid, { status: nextStatus }, user?.email || 'admin');
      showToast(`Account ${nextStatus}.`, 'success');
      await load();
      if (selected?.uid === st.uid) {
        setSelected({ ...selected, status: nextStatus });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold">{t.admin.students}</h2>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] text-sm"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] overflow-x-auto">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <th className="py-3.5 px-4 text-start font-semibold">Student</th>
              <th className="py-3.5 px-4 text-start font-semibold">Phone</th>
              <th className="py-3.5 px-4 text-start font-semibold">Joined</th>
              <th className="py-3.5 px-4 text-start font-semibold">Status</th>
              <th className="py-3.5 px-4 text-end font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  {t.common.loading}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No students found.
                </td>
              </tr>
            ) : (
              filtered.map((st) => (
                <tr key={st.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <div className="font-semibold">{st.fullName}</div>
                    <div className="text-xs text-slate-500">{st.email}</div>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono-tabular">{st.phone || '—'}</td>
                  <td className="py-3 px-4 text-xs font-mono-tabular text-slate-500">
                    {formatFirestoreDate(st.createdAt, language)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={st.status} />
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button
                      type="button"
                      onClick={() => openDetail(st)}
                      className="px-3 py-1.5 rounded-lg bg-violet-600/10 text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white text-xs font-semibold transition-colors"
                    >
                      Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold">{selected.fullName}</h3>
                <p className="text-xs text-slate-500">
                  {selected.email} · {selected.phone || 'No phone'}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="p-1.5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#070912] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold">Account Status:</span>
                <StatusBadge status={selected.status} />
              </div>
              <button
                type="button"
                onClick={() => handleToggleSuspend(selected)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  selected.status === 'active'
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {selected.status === 'active' ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Suspend</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Reactivate</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Application History
              </h4>
              <div className="space-y-2">
                {applications
                  .filter((a) => a.studentUid === selected.uid)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800"
                    >
                      <span className="font-semibold">{a.trackTitleEn}</span>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                {applications.filter((a) => a.studentUid === selected.uid).length === 0 && (
                  <p className="text-xs text-slate-500">No applications.</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Certificates
              </h4>
              <div className="space-y-2">
                {certificates
                  .filter((c) => c.studentUid === selected.uid)
                  .map((c) => (
                    <div
                      key={c.certificateId}
                      className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800"
                    >
                      <span className="font-mono-tabular font-semibold">
                        {c.certificateId} — {c.trackName}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                {certificates.filter((c) => c.studentUid === selected.uid).length === 0 && (
                  <p className="text-xs text-slate-500">No certificates issued.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold">Internal Admin Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveNotes}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold disabled:opacity-60"
              >
                {saving ? t.common.loading : 'Save Internal Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
