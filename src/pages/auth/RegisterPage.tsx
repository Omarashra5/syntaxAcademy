import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, UserPlus } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';

export const RegisterPage: React.FC = () => {
  const { t } = useLanguage();
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatAuthError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('auth/operation-not-allowed')) {
      return 'Email/Password registration is not yet enabled in Firebase Console -> Authentication -> Sign-in method. You can use Google Sign-In or enable Email/Password in Firebase Console.';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists.';
    }
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (fullName.trim().length < 2) {
      setErrorMsg('Full name must be at least 2 characters.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(fullName, email, password);
      showToast('Account created! Please verify your email address.', 'success');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const msg = formatAuthError(err);
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const msg = formatAuthError(err);
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070912] text-slate-900 dark:text-slate-100">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold">{t.auth.registerTitle}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.auth.registerSubtitle}</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070912] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <span>{t.auth.googleSignIn}</span>
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span>{t.auth.orContinue}</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.auth.fullName}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
            </div>

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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.auth.password}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.auth.confirmPassword}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? t.common.loading : t.auth.createAccount}</span>
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
            {t.auth.haveAccount}{' '}
            <Link
              to="/login"
              state={{ from: redirectPath }}
              className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              {t.nav.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
