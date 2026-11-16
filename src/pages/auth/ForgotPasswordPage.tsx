import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Mail } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useLanguage();
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      showToast(t.auth.resetSent, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to send reset email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070912] text-slate-900 dark:text-slate-100">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 sm:p-8 shadow-xl">
          <h1 className="font-display text-xl font-bold">{t.auth.forgotTitle}</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t.auth.forgotSubtitle}
          </p>

          {sent ? (
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{t.auth.resetSent}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.auth.email}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                <Mail className="w-4 h-4" />
                <span>{loading ? t.common.loading : t.auth.sendReset}</span>
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              {t.auth.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
