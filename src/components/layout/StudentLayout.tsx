import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  FileText,
  Globe,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  Terminal,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { NotificationBell } from '../common/NotificationBell';

export const StudentLayout: React.FC = () => {
  const { user, studentProfile, logout, resendVerificationEmail } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: t.student.overview, Icon: LayoutDashboard, end: true },
    { to: '/dashboard/applications', label: t.student.applications, Icon: FileText },
    { to: '/dashboard/courses', label: t.student.courses, Icon: BookOpen },
    { to: '/dashboard/certificates', label: t.student.certificates, Icon: Award },
    { to: '/dashboard/profile', label: t.student.profile, Icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      showToast(t.auth.verificationSent, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to send verification email.', 'error');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <Link to="/" className="inline-flex items-center gap-2.5 font-display font-bold text-slate-900 dark:text-white">
          <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </span>
          <span>{t.brand}</span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/80">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.student.portalTitle}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5">
          {studentProfile?.fullName || user?.displayName || user?.email}
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.Icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          <Home className="w-4 h-4 shrink-0" />
          <span>{t.common.backHome}</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{t.nav.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#070912] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-e border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121]">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-[#0D1121] border-e border-slate-200 dark:border-slate-800 z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#070912]/90 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-display font-semibold truncate">
              {t.student.portalTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:border-violet-500/50 transition-colors whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5 text-violet-500" />
              <span>{language === 'en' ? 'العربية' : 'EN'}</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user && <NotificationBell recipientUid={user.uid} />}
          </div>
        </header>

        {user && !user.emailVerified && user.providerData.some((p) => p.providerId === 'password') && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-amber-700 dark:text-amber-300">
            <span>{t.auth.verifyBanner}</span>
            <button
              type="button"
              onClick={handleResendVerification}
              className="font-semibold underline hover:no-underline"
            >
              {t.auth.resendVerification}
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
