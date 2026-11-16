import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Download, Eye, ShieldCheck, X } from 'lucide-react';
import { CertificatePreview } from '../../components/common/CertificatePreview';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { downloadCertificatePdf } from '../../lib/certificatePdf';
import { getStudentCertificates } from '../../services/firestoreService';
import type { Certificate } from '../../types';

export const StudentCertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getStudentCertificates(user.uid)
      .then(setCertificates)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">{t.student.certificates}</h2>

      {loading ? (
        <div className="h-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] animate-pulse" />
      ) : certificates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-10 text-center">
          <Award className="w-8 h-8 text-violet-500 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t.student.noCertificates}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.certificateId}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-mono-tabular text-violet-600 dark:text-violet-400 font-semibold">
                    {cert.certificateId}
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold">{cert.trackName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Instructor: {cert.instructorName} · {cert.completionDate}
                  </p>
                </div>
                <StatusBadge status={cert.status} />
              </div>

              {cert.grade && (
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Achievement: {cert.grade}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewCert(cert)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t.student.previewCert}</span>
                </button>
                {cert.status === 'valid' && (
                  <button
                    type="button"
                    onClick={() => downloadCertificatePdf(cert)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.student.downloadPdf}</span>
                  </button>
                )}
                <Link
                  to={`/verify-certificate/${encodeURIComponent(cert.certificateId)}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline ms-auto"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t.student.verifyAuthenticity}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="max-w-4xl w-full rounded-2xl bg-white dark:bg-[#0D1121] border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold">
                Certificate Preview ({previewCert.certificateId})
              </h3>
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <CertificatePreview certificate={previewCert} />
            <div className="flex justify-end gap-2">
              {previewCert.status === 'valid' && (
                <button
                  type="button"
                  onClick={() => downloadCertificatePdf(previewCert)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.student.downloadPdf}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
