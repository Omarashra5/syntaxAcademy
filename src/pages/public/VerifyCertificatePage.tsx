import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Download, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { CertificatePreview } from '../../components/common/CertificatePreview';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { useLanguage } from '../../contexts/LanguageContext';
import { downloadCertificatePdf } from '../../lib/certificatePdf';
import { verifyCertificateById } from '../../services/firestoreService';
import type { Certificate } from '../../types';

export const VerifyCertificatePage: React.FC = () => {
  const { certificateId: routeCertId } = useParams<{ certificateId?: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [queryId, setQueryId] = useState(routeCertId || '');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  const runLookup = async (id: string) => {
    const clean = id.trim();
    if (!clean) return;
    setLoading(true);
    setSearched(true);
    try {
      const result = await verifyCertificateById(clean);
      setCertificate(result);
    } catch {
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeCertId) {
      setQueryId(routeCertId);
      runLookup(routeCertId);
    }
  }, [routeCertId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryId.trim()) return;
    navigate(`/verify-certificate/${encodeURIComponent(queryId.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070912] text-slate-900 dark:text-slate-100">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 lg:py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold">{t.verify.title}</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {t.verify.subtitle}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                placeholder={t.verify.placeholder}
                className="w-full ps-10 pe-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] text-sm font-mono-tabular"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {loading ? t.common.loading : t.verify.verifyBtn}
            </button>
          </form>
        </div>

        {loading && (
          <div className="mt-10 h-64 rounded-2xl bg-white dark:bg-[#0D1121] border border-slate-200 dark:border-slate-800 animate-pulse" />
        )}

        {!loading && searched && !certificate && (
          <div className="mt-10 max-w-xl mx-auto rounded-2xl border border-rose-500/30 bg-white dark:bg-[#0D1121] p-6 text-center">
            <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
              {t.verify.notFound}
            </p>
          </div>
        )}

        {!loading && certificate && (
          <div className="mt-10 space-y-8">
            <div
              className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                certificate.status === 'valid'
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-rose-500/40 bg-rose-500/5'
              }`}
            >
              <div className="flex items-start gap-3">
                {certificate.status === 'valid' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h2
                    className={`text-lg font-bold ${
                      certificate.status === 'valid'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {certificate.status === 'valid' ? t.verify.validBadge : t.verify.revokedBadge}
                  </h2>
                  {certificate.status === 'revoked' && certificate.revokedReason && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                      Reason: {certificate.revokedReason}
                    </p>
                  )}
                </div>
              </div>

              {certificate.status === 'valid' && (
                <button
                  type="button"
                  onClick={() => downloadCertificatePdf(certificate)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.student.downloadPdf}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t.verify.studentName}
                </div>
                <div className="mt-1 text-sm font-semibold">{certificate.studentFullName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t.verify.trackName}
                </div>
                <div className="mt-1 text-sm font-semibold">{certificate.trackName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t.verify.instructor}
                </div>
                <div className="mt-1 text-sm font-semibold">{certificate.instructorName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t.verify.completionDate}
                </div>
                <div className="mt-1 text-sm font-semibold font-mono-tabular">
                  {certificate.completionDate}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t.verify.certificateId}
                </div>
                <div className="mt-1 text-sm font-semibold font-mono-tabular">
                  {certificate.certificateId}
                </div>
              </div>
              {certificate.grade && (
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t.verify.grade}
                  </div>
                  <div className="mt-1 text-sm font-semibold">{certificate.grade}</div>
                </div>
              )}
            </div>

            <CertificatePreview certificate={certificate} />
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};
