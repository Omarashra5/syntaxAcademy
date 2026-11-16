import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Download,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { CertificatePreview } from '../../components/common/CertificatePreview';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { downloadCertificatePdf } from '../../lib/certificatePdf';
import {
  adminGetAllCollections,
  adminIssueCertificate,
  adminUpdateCertificateStatus,
} from '../../services/firestoreService';
import type { Certificate, Instructor, LearningTrack, StudentUser } from '../../types';

function makeCertId(): string {
  const yr = new Date().getFullYear();
  const rnd = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SYN-${yr}-${rnd}`;
}

export const AdminCertificatesPage: React.FC = () => {
  const { user, isFirebaseAdmin } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const [selectedStudentUid, setSelectedStudentUid] = useState('');
  const [studentFullName, setStudentFullName] = useState('');
  const [trackId, setTrackId] = useState('');
  const [trackName, setTrackName] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().slice(0, 10));
  const [certificateId, setCertificateId] = useState(makeCertId());
  const [grade, setGrade] = useState('');
  const [issuing, setIssuing] = useState(false);

  const [search, setSearch] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null);

  const load = async () => {
    if (!isFirebaseAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await adminGetAllCollections();
      setStudents(data.students);
      setTracks(data.tracks);
      setInstructors(data.instructors);
      setCertificates(data.certificates);

      if (data.tracks.length > 0 && !trackId) {
        setTrackId(data.tracks[0].id);
        setTrackName(data.tracks[0].titleEn);
      }
      if (data.instructors.length > 0 && !instructorId) {
        setInstructorId(data.instructors[0].id);
        setInstructorName(data.instructors[0].nameEn);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isFirebaseAdmin]);

  const handleStudentSelect = (uid: string) => {
    setSelectedStudentUid(uid);
    const found = students.find((s) => s.uid === uid);
    if (found) {
      setStudentFullName(found.fullName);
    }
  };

  const handleTrackSelect = (id: string) => {
    setTrackId(id);
    const found = tracks.find((tr) => tr.id === id);
    if (found) {
      setTrackName(found.titleEn);
    }
  };

  const handleInstructorSelect = (id: string) => {
    setInstructorId(id);
    const found = instructors.find((i) => i.id === id);
    if (found) {
      setInstructorName(found.nameEn);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFullName.trim() || !trackName.trim() || !instructorName.trim() || !certificateId.trim()) {
      showToast('Please complete all required certificate fields.', 'error');
      return;
    }

    setIssuing(true);
    try {
      const created = await adminIssueCertificate(
        {
          certificateId: certificateId.trim(),
          studentUid: selectedStudentUid || '',
          studentFullName: studentFullName.trim(),
          trackId: trackId || '',
          trackName: trackName.trim(),
          instructorId: instructorId || '',
          instructorName: instructorName.trim(),
          completionDate,
          grade: grade.trim(),
        },
        user?.email || 'admin'
      );
      showToast(`Certificate ${created.certificateId} issued successfully.`, 'success');
      setCertificateId(makeCertId());
      setGrade('');
      await load();
    } catch (err) {
      if (err instanceof Error && err.message === 'DUPLICATE_CERTIFICATE_ID') {
        showToast('Certificate ID already exists. Please use a unique ID.', 'error');
      } else {
        showToast(err instanceof Error ? err.message : 'Failed to issue certificate.', 'error');
      }
    } finally {
      setIssuing(false);
    }
  };

  const handleToggleRevoke = async () => {
    if (!revokeTarget) return;
    const nextStatus = revokeTarget.status === 'valid' ? 'revoked' : 'valid';
    try {
      await adminUpdateCertificateStatus(
        revokeTarget.certificateId,
        nextStatus,
        nextStatus === 'revoked' ? 'Revoked by Syntax Academy Administration' : '',
        user?.email || 'admin'
      );
      showToast(
        nextStatus === 'revoked' ? 'Certificate revoked.' : 'Certificate restored.',
        'success'
      );
      setRevokeTarget(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update certificate.', 'error');
    }
  };

  const filteredCerts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return certificates;
    return certificates.filter(
      (c) =>
        c.certificateId.toLowerCase().includes(q) ||
        c.studentFullName.toLowerCase().includes(q) ||
        c.trackName.toLowerCase().includes(q)
    );
  }, [certificates, search]);

  const previewData = {
    certificateId: certificateId || 'SYN-2026-PREVIEW',
    studentFullName: studentFullName || 'Student Full Name',
    trackName: trackName || 'Full Stack Development',
    instructorName: instructorName || 'Omar Ashraf',
    completionDate: completionDate || '2026-11-16',
    grade,
    status: 'valid' as const,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">{t.admin.certificates}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Certificates are always generated in English (A4 Landscape PDF) with QR verification.
          </p>
        </div>
      </div>

      {/* Certificate Generator Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleIssue}
          className="xl:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 space-y-4"
        >
          <h3 className="font-display text-base font-bold">Issue New Certificate</h3>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Select Existing Student (Optional)
            </label>
            <select
              value={selectedStudentUid}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
            >
              <option value="">Manual Student Entry</option>
              {students.map((st) => (
                <option key={st.uid} value={st.uid}>
                  {st.fullName} ({st.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Student Full Name (English)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Youssef Mohamed Hassan"
              value={studentFullName}
              onChange={(e) => setStudentFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Completed Track</label>
              <select
                value={trackId}
                onChange={(e) => handleTrackSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              >
                {tracks.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.titleEn}
                  </option>
                ))}
                <option value="">Custom Track Name</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Track Name (English)</label>
              <input
                type="text"
                required
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Instructor</label>
              <select
                value={instructorId}
                onChange={(e) => handleInstructorSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              >
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nameEn}
                  </option>
                ))}
                <option value="">Custom Instructor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Instructor Name (English)</label>
              <input
                type="text"
                required
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Completion Date</label>
              <input
                type="date"
                required
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm font-mono-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Grade / Achievement (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Distinction (96%)"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Unique Certificate ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                pattern="^[a-zA-Z0-9_-]+$"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm font-mono-tabular"
              />
              <button
                type="button"
                onClick={() => setCertificateId(makeCertId())}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
                title="Generate new unique ID"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New ID</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              type="submit"
              disabled={issuing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-60"
            >
              <Award className="w-4 h-4" />
              <span>{issuing ? t.common.loading : t.admin.generateCert}</span>
            </button>
            <button
              type="button"
              onClick={() => downloadCertificatePdf(previewData)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="w-4 h-4" />
              <span>Preview PDF</span>
            </button>
          </div>
        </form>

        {/* Live Preview */}
        <div className="xl:col-span-7 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Live English A4 Landscape Certificate Preview
          </div>
          <CertificatePreview certificate={previewData} />
        </div>
      </div>

      {/* Issued Certificates Registry */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-display text-lg font-bold">
            Issued Certificates ({certificates.length})
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, student, track..."
              className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <th className="py-3 px-3 text-start font-semibold">Certificate ID</th>
                <th className="py-3 px-3 text-start font-semibold">Student</th>
                <th className="py-3 px-3 text-start font-semibold">Track</th>
                <th className="py-3 px-3 text-start font-semibold">Date</th>
                <th className="py-3 px-3 text-start font-semibold">Status</th>
                <th className="py-3 px-3 text-end font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    {t.common.loading}
                  </td>
                </tr>
              ) : filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No certificates issued yet.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.certificateId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-mono-tabular text-xs font-semibold">
                      {cert.certificateId}
                    </td>
                    <td className="py-3 px-3 font-medium">{cert.studentFullName}</td>
                    <td className="py-3 px-3 text-xs">{cert.trackName}</td>
                    <td className="py-3 px-3 text-xs font-mono-tabular text-slate-500">
                      {cert.completionDate}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={cert.status} />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => downloadCertificatePdf(cert)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/verify-certificate/${encodeURIComponent(cert.certificateId)}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Open Public Verification"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setRevokeTarget(cert)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold ${
                            cert.status === 'valid'
                              ? 'border-rose-500/30 text-rose-500 hover:bg-rose-500/10'
                              : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                          }`}
                          title={cert.status === 'valid' ? 'Revoke Certificate' : 'Restore Certificate'}
                        >
                          {cert.status === 'valid' ? (
                            <ShieldAlert className="w-3.5 h-3.5" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title={
          revokeTarget?.status === 'valid' ? t.admin.revokeCert : t.admin.restoreCert
        }
        description={
          revokeTarget?.status === 'valid'
            ? `Revoking certificate ${revokeTarget?.certificateId} will immediately mark it invalid on the public verification registry.`
            : `Restore certificate ${revokeTarget?.certificateId} to valid status?`
        }
        confirmLabel={
          revokeTarget?.status === 'valid' ? t.admin.revokeCert : t.admin.restoreCert
        }
        cancelLabel={t.common.cancel}
        variant={revokeTarget?.status === 'valid' ? 'danger' : 'primary'}
        onConfirm={handleToggleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
};
