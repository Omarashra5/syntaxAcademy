import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe, Menu, Moon, Sun, Terminal, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationBell } from '../common/NotificationBell';

export const PublicNavbar: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, isServerAdmin, isFirebaseAdmin } = useAuth();
  const isAdmin = isServerAdmin || isFirebaseAdmin;
  const dashboardPath = isAdmin ? '/admin' : '/dashboard';
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSectionClick = (hash: string) => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate(`/${hash}`);
      return;
    }
    const id = hash.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#070912]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 text-lg font-display font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </span>
          <span>{t.brand}</span>
        </Link>

        {/* Zone 2: Concise Single-Line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => handleSectionClick('#hero')}
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.home}
          </button>
          <button
            type="button"
            onClick={() => handleSectionClick('#about')}
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.about}
          </button>
          <button
            type="button"
            onClick={() => handleSectionClick('#tracks')}
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.tracks}
          </button>
          <button
            type="button"
            onClick={() => handleSectionClick('#instructors')}
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.instructors}
          </button>
          <button
            type="button"
            onClick={() => handleSectionClick('#courses')}
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.courses}
          </button>
          <button
            type="button"
            onClick={() => handleSectionClick('#contact')}
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.contact}
          </button>
          <Link
            to="/verify-certificate"
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors whitespace-nowrap shrink-0"
          >
            {t.nav.verify}
          </Link>
        </nav>

        {/* Zone 3: Language, Theme, and Auth Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-violet-500/50 transition-colors whitespace-nowrap shrink-0"
            aria-label="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-violet-500" />
            <span>{language === 'en' ? 'العربية' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-violet-500/50 transition-colors shrink-0"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {!isAdmin && <NotificationBell recipientUid={user.uid} />}
              <Link
                to={dashboardPath}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.dashboard}
              </Link>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.login}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.register}
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] px-4 py-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm font-medium">
            <button
              type="button"
              onClick={() => handleSectionClick('#hero')}
              className="text-start px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              {t.nav.home}
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('#about')}
              className="text-start px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              {t.nav.about}
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('#tracks')}
              className="text-start px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              {t.nav.tracks}
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('#instructors')}
              className="text-start px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              {t.nav.instructors}
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('#courses')}
              className="text-start px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              {t.nav.courses}
            </button>
            <button
              type="button"
              onClick={() => handleSectionClick('#contact')}
              className="text-start px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              {t.nav.contact}
            </button>
            <Link
              to="/verify-certificate"
              onClick={() => setMobileOpen(false)}
              className="text-start px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 col-span-2"
            >
              {t.nav.verify}
            </Link>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            {user ? (
              <Link
                to={dashboardPath}
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold"
              >
                {t.nav.dashboard}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold"
                >
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
