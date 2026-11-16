import React, { useEffect, useState } from 'react';
import { KeyRound, Save, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { INITIAL_SETTINGS } from '../../lib/seedData';
import { formatFirestoreDate } from '../../lib/validation';
import { rotateAdminPassword } from '../../services/adminApiService';
import {
  adminGetAllCollections,
  getAcademySettings,
  saveAcademySettings,
} from '../../services/firestoreService';
import type { AcademySettings, AuditLog, Language } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const { user, isFirebaseAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<Omit<AcademySettings, 'updatedAt'>>(INITIAL_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    getAcademySettings().then((cfg) => {
      if (cfg) setSettings(cfg);
    });
    if (isFirebaseAdmin) {
      adminGetAllCollections().then((data) => setAuditLogs(data.auditLogs));
    }
  }, [isFirebaseAdmin]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAcademySettings(settings, user?.email || 'admin');
      showToast('Academy settings saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRotatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 10) {
      showToast('New admin password must be at least 10 characters.', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setRotating(true);
    try {
      await rotateAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('Administrator password rotated securely on server.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to rotate password.', 'error');
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="font-display text-2xl font-bold">{t.admin.settings}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSaveSettings}
          className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 space-y-4"
        >
          <h3 className="font-display text-base font-bold">Platform & Homepage Settings</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Academy Name</label>
              <input
                type="text"
                required
                value={settings.academyName}
                onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Default Language</label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) =>
                  setSettings({ ...settings, defaultLanguage: e.target.value as Language })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              >
                <option value="en">English (LTR)</option>
                <option value="ar">Arabic (RTL)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Admissions Phone</label>
              <input
                type="text"
                required
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm font-mono-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Admissions Email</label>
              <input
                type="email"
                required
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Hero Headline (EN)</label>
              <input
                type="text"
                value={settings.heroHeadlineEn || ''}
                onChange={(e) => setSettings({ ...settings, heroHeadlineEn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Hero Headline (AR)</label>
              <input
                type="text"
                dir="rtl"
                value={settings.heroHeadlineAr || ''}
                onChange={(e) => setSettings({ ...settings, heroHeadlineAr: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold pt-1">
            <input
              type="checkbox"
              checked={settings.applicationsOpen}
              onChange={(e) => setSettings({ ...settings, applicationsOpen: e.target.checked })}
            />
            <span>Global Applications Open</span>
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || !isFirebaseAdmin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? t.common.loading : t.common.save}</span>
            </button>
          </div>
        </form>

        {/* Rotate Admin Password */}
        <form
          onSubmit={handleRotatePassword}
          className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-violet-500" />
            <h3 className="font-display text-base font-bold">{t.admin.rotatePassword}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rotates the server-side scrypt hashed administrator credential without storing plaintext secrets in Firestore or frontend code.
          </p>
          <div>
            <label className="block text-xs font-semibold mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">New Password (min 10 chars)</label>
            <input
              type="password"
              required
              minLength={10}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={10}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={rotating}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-violet-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {rotating ? t.common.loading : t.admin.rotatePassword}
          </button>
        </form>
      </div>

      {/* Audit Logs */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-500" />
          <h3 className="font-display text-base font-bold">{t.admin.auditLogs}</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {auditLogs.length === 0 ? (
            <p className="text-slate-500 py-4">No audit entries recorded yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono-tabular font-semibold text-violet-500">
                    {log.action}
                  </span>{' '}
                  <span className="text-slate-600 dark:text-slate-300">
                    · {log.targetType}/{log.targetId}
                  </span>
                  {log.details && (
                    <span className="text-slate-500 block mt-0.5">{log.details}</span>
                  )}
                </div>
                <div className="text-slate-400 font-mono-tabular">
                  {log.actor} · {formatFirestoreDate(log.createdAt, language)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
