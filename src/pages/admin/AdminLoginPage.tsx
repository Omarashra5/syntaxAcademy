import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { loginAdminWithPassword } from '../../services/adminApiService';

export const AdminLoginPage: React.FC = () => {
  const { t } = useLanguage();
  const { refreshAdminSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg('');
    setLoading(true);
    try {
      await loginAdminWithPassword(password);
      const sessionConfirmed = await refreshAdminSession();
      if (!sessionConfirmed) {
        const msg =
          'Password verified, but your browser may have blocked the session cookie in this view. Please allow cookies or open the app in a standalone browser tab and try again.';
        setErrorMsg(msg);
        showToast(msg, 'error');
        return;
      }
      showToast('Administrator session verified.', 'success');
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid administrator password.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070912] text-slate-100 px-4 py-12">
      <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-[#0D1121] p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">{t.admin.loginTitle}</h1>
            <p className="text-xs text-slate-400">{t.admin.loginSubtitle}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.admin.passwordLabel}
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#070912] text-sm text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? t.common.loading : t.admin.unlockButton}</span>
          </button>
        </form>

        <p className="mt-5 text-xs text-slate-400 leading-relaxed">{t.admin.firebaseSyncNote}</p>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <Link to="/" className="text-xs font-medium text-violet-400 hover:underline">
            {t.common.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
};
