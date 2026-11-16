import React, { useEffect, useState } from 'react';
import { verifyBeforeUpdateEmail, updateProfile } from 'firebase/auth';
import { Save, Upload } from 'lucide-react';
import { SafeImage } from '../../components/common/SafeImage';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { profileSchema } from '../../lib/validation';
import { updateStudentProfile, uploadImageToStorage } from '../../services/firestoreService';

export const StudentProfilePage: React.FC = () => {
  const { user, studentProfile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (studentProfile || user) {
      setFullName(studentProfile?.fullName || user?.displayName || '');
      setPhone(studentProfile?.phone || '');
      setBio(studentProfile?.bio || '');
      setAvatarUrl(studentProfile?.avatarUrl || user?.photoURL || '');
      setNewEmail(studentProfile?.email || user?.email || '');
    }
  }, [studentProfile, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadImageToStorage(file, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      setAvatarUrl(url);
      await updateStudentProfile(user.uid, { fullName, phone, bio, avatarUrl: url });
      await refreshProfile();
      showToast('Profile photo uploaded.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Unable to upload photo to Firebase Storage.',
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = profileSchema.safeParse({ fullName, phone, bio, avatarUrl });
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || 'Check your profile fields.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateStudentProfile(user.uid, parsed.data);
      await updateProfile(user, {
        displayName: parsed.data.fullName,
        photoURL: parsed.data.avatarUrl || undefined,
      });
      await refreshProfile();
      showToast(t.student.profileUpdated, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!user || !newEmail.trim() || newEmail.trim() === user.email) return;
    try {
      await verifyBeforeUpdateEmail(user, newEmail.trim());
      showToast(
        'Verification link sent to your new email address. Confirm it to complete the update.',
        'success'
      );
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Please log out and sign back in recently before changing email.',
        'error'
      );
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="font-display text-2xl font-bold">{t.student.profile}</h2>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 space-y-5"
      >
        <div className="flex items-center gap-4">
          <SafeImage
            src={avatarUrl}
            alt={fullName || 'Student Avatar'}
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            fallbackLabel={fullName || 'Student'}
          />
          <div>
            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? t.common.loading : t.student.uploadAvatar}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">{t.auth.fullName}</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">{t.student.phone}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">{t.student.bio}</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? t.common.loading : t.student.saveProfile}</span>
        </button>
      </form>

      {/* Secure Email Update Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 space-y-4">
        <h3 className="font-display text-base font-bold">{t.auth.email}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t.student.emailUpdateNote}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
          />
          <button
            type="button"
            onClick={handleEmailChange}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Update Email
          </button>
        </div>
      </div>
    </div>
  );
};
