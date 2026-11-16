import React, { useEffect, useState } from 'react';
import { CreditCard, Edit2, Plus, X } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrencyEgp, generateId } from '../../lib/validation';
import { adminGetAllCollections, adminSavePayment } from '../../services/firestoreService';
import type { LearningTrack, PaymentRecord, PaymentStatus, StudentUser } from '../../types';

export const AdminPaymentsPage: React.FC = () => {
  const { user, isFirebaseAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentRecord | null>(null);
  const [form, setForm] = useState({
    studentUid: '',
    trackId: '',
    totalFee: 2500,
    amountPaid: 0,
    paymentMethod: 'Vodafone Cash',
    status: 'pending' as PaymentStatus,
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!isFirebaseAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await adminGetAllCollections();
      setPayments(data.payments);
      setStudents(data.students);
      setTracks(data.tracks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isFirebaseAdmin]);

  const openNew = () => {
    setEditing(null);
    const firstTrack = tracks[0];
    setForm({
      studentUid: students[0]?.uid || '',
      trackId: firstTrack?.id || '',
      totalFee: firstTrack?.discountedPrice || 2500,
      amountPaid: 0,
      paymentMethod: 'Vodafone Cash',
      status: 'pending',
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (p: PaymentRecord) => {
    setEditing(p);
    setForm({
      studentUid: p.studentUid,
      trackId: p.trackId,
      totalFee: p.totalFee,
      amountPaid: p.amountPaid,
      paymentMethod: p.paymentMethod,
      status: p.status,
      paymentDate: p.paymentDate,
      notes: p.notes || '',
    });
    setModalOpen(true);
  };

  const handleTrackChange = (trackId: string) => {
    const tr = tracks.find((x) => x.id === trackId);
    setForm((prev) => ({
      ...prev,
      trackId,
      totalFee: tr ? tr.discountedPrice : prev.totalFee,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.uid === form.studentUid);
    const tr = tracks.find((x) => x.id === form.trackId);
    if (!st || !tr) {
      showToast('Select a valid student and track.', 'error');
      return;
    }

    setSaving(true);
    try {
      const id = editing?.id || generateId('pay');
      await adminSavePayment(
        {
          id,
          studentUid: st.uid,
          studentName: st.fullName,
          studentEmail: st.email,
          trackId: tr.id,
          trackTitle: tr.titleEn,
          totalFee: Number(form.totalFee),
          amountPaid: Number(form.amountPaid),
          currency: 'EGP',
          paymentMethod: form.paymentMethod.trim() || 'Manual Confirmation',
          status: form.status,
          paymentDate: form.paymentDate,
          notes: form.notes.trim(),
        },
        !editing,
        user?.email || 'admin'
      );
      showToast('Payment record saved.', 'success');
      setModalOpen(false);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save payment.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const totalOutstanding = payments.reduce(
    (sum, p) => sum + Math.max(0, (p.totalFee || 0) - (p.amountPaid || 0)),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">{t.admin.payments}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manual payment confirmation and outstanding tuition ledger (EGP).
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payment Record</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5">
          <CreditCard className="w-5 h-5 text-emerald-500 mb-2" />
          <div className="text-2xl font-display font-bold font-mono-tabular">
            {formatCurrencyEgp(totalCollected, language)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total Confirmed Payments</div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5">
          <CreditCard className="w-5 h-5 text-amber-500 mb-2" />
          <div className="text-2xl font-display font-bold font-mono-tabular">
            {formatCurrencyEgp(totalOutstanding, language)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total Outstanding Balance</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] overflow-x-auto">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <th className="py-3.5 px-4 text-start font-semibold">Student</th>
              <th className="py-3.5 px-4 text-start font-semibold">Track</th>
              <th className="py-3.5 px-4 text-start font-semibold">Paid / Fee</th>
              <th className="py-3.5 px-4 text-start font-semibold">Balance</th>
              <th className="py-3.5 px-4 text-start font-semibold">Method & Date</th>
              <th className="py-3.5 px-4 text-start font-semibold">Status</th>
              <th className="py-3.5 px-4 text-end font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  {t.common.loading}
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No payment records yet.
                </td>
              </tr>
            ) : (
              payments.map((p) => {
                const balance = Math.max(0, p.totalFee - p.amountPaid);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold">{p.studentName}</td>
                    <td className="py-3 px-4 text-xs">{p.trackTitle}</td>
                    <td className="py-3 px-4 font-mono-tabular text-xs">
                      {p.amountPaid} / {p.totalFee} EGP
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-xs text-amber-600 dark:text-amber-400">
                      {balance} EGP
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {p.paymentMethod} · {p.paymentDate}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">
                {editing ? 'Update Payment Record' : 'Record Manual Payment'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Student</label>
                <select
                  required
                  value={form.studentUid}
                  onChange={(e) => setForm({ ...form, studentUid: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                >
                  {students.map((st) => (
                    <option key={st.uid} value={st.uid}>
                      {st.fullName} ({st.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Track</label>
                <select
                  required
                  value={form.trackId}
                  onChange={(e) => handleTrackChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                >
                  {tracks.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.titleEn} ({tr.discountedPrice} EGP)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Total Fee (EGP)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.totalFee}
                    onChange={(e) => setForm({ ...form, totalFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Amount Paid (EGP)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.amountPaid}
                    onChange={(e) => setForm({ ...form, amountPaid: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm font-mono-tabular"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Method</label>
                  <input
                    type="text"
                    required
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as PaymentStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={form.paymentDate}
                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm font-mono-tabular"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
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
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold disabled:opacity-60"
                >
                  {saving ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
