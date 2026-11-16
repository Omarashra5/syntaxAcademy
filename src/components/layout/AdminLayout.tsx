import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CreditCard,
  FileText,
  Globe,
  Layers,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { logoutAdminSession } from '../../services/adminApiService';
import { NotificationBell } from '../common/NotificationBell';

export const AdminLayout: React.FC = () => {
  const { user, isFirebaseAdmin, loginWithGoogle, refreshAdminSession } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/admin', label: t.admin.overview, Icon: LayoutDashboard, end: true },
    { to: '/admin/applications', label: t.admin.applications, Icon: FileText },
    { to: '/admin/tracks', label: t.admin.tracks, Icon: Layers },
    { to: '/admin/instructors', label: t.admin.instructors, Icon: UserCheck },
    { to: '/admin/courses', label: t.admin.courses, Icon: BookOpen },
    { to: '/admin/certificates', label: t.admin.certificates, Icon: Award },
    { to: '/admin/students', label: t.admin.students, Icon: Users },
    { to: '/admin/payments', label: t.admin.payments, Icon: CreditCard },
    { to: '/admin/announcements', label: t.admin.announcements, Icon: Megaphone },
    { to: '/admin/settings', label: t.admin.settings, Icon: Settings },
  ];

  const handleAdminLogout = async () => {
    await logoutAdminSession();
    await refreshAdminSession();
    navigate('/admin/login');
  };

  const handleConnectGoogleAdmin = async () => {
    try {
      await loginWithGoogle();
      showToast(
        language === 'ar' ? 'تم ربط حساب Google بنجاح.' : 'Google account connected.',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Google Sign-In failed.', 'error');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0A0E1C] text-slate-200">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
        <Link to="/admin" className="inline-flex items-center gap-2.5 font-display font-bold text-white">
          <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <span>Syntax Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
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
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800/80 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/70 transition-colors"
        >
          <span>{t.common.backHome}</span>
        </Link>
        <button
          type="button"
          onClick={handleAdminLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{t.nav.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#070912] text-slate-900 dark:text-slate-100">
      <aside className="hidden lg:block w-64 shrink-0 border-e border-slate-800 bg-[#0A0E1C]">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-[#0A0E1C] border-e border-slate-800 z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0D1121]/90 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800"
              aria-label="Open admin menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-display font-semibold truncate">
              {t.admin.portalTitle}
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
            {isFirebaseAdmin && <NotificationBell recipientUid="admin" />}
          </div>
        </header>

        {!isFirebaseAdmin && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
            <span>
              {language === 'ar'
                ? 'تم التحقق من جلسة الإدارة على الخادم. لتفعيل صلاحيات الكتابة المباشرة في Firestore، يرجى تسجيل الدخول بحساب Google الإداري المعتمد (omaejensi@gmail.com).'
                : `Server admin session active. To authorize direct Firestore database writes via Security Rules, sign in with the authorized Google Admin account (${user?.email ? `currently ${user.email}` : 'omaejensi@gmail.com'}).`}
            </span>
            <button
              type="button"
              onClick={handleConnectGoogleAdmin}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold whitespace-nowrap transition-colors"
            >
              {language === 'ar' ? 'ربط حساب Google الإداري' : 'Connect Google Admin'}
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
