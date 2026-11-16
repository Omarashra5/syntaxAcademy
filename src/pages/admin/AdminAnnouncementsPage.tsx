import React, { useEffect, useState } from 'react';
import { CheckCircle2, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { formatFirestoreDate, generateId } from '../../lib/validation';
import {
  adminDeleteAnnouncement,
  adminDeleteTestimonial,
  adminGetAllCollections,
  adminResolveContactMessage,
  adminSaveAnnouncement,
  adminSaveTestimonial,
} from '../../services/firestoreService';
import type { Announcement, ContactMessage, Testimonial } from '../../types';

export const AdminAnnouncementsPage: React.FC = () => {
  const { user, isFirebaseAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'announcements' | 'testimonials' | 'inbox'>('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [annForm, setAnnForm] = useState({
    titleEn: '',
    titleAr: '',
    bodyEn: '',
    bodyAr: '',
    priority: 'normal' as 'normal' | 'important',
    isPublished: true,
  });

  const load = async () => {
    if (!isFirebaseAdmin) return;
    const data = await adminGetAllCollections();
    setAnnouncements(data.announcements);
    setTestimonials(data.testimonials);
    setMessages(data.contactMessages);
  };

  useEffect(() => {
    load();
  }, [isFirebaseAdmin]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminSaveAnnouncement(
        {
          id: generateId('ann'),
          ...annForm,
          titleEn: annForm.titleEn.trim(),
          titleAr: annForm.titleAr.trim(),
          bodyEn: annForm.bodyEn.trim(),
          bodyAr: annForm.bodyAr.trim(),
        },
        true,
        user?.email || 'admin'
      );
      showToast('Announcement published.', 'success');
      setModalOpen(false);
      setAnnForm({
        titleEn: '',
        titleAr: '',
        bodyEn: '',
        bodyAr: '',
        priority: 'normal',
        isPublished: true,
      });
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create announcement.', 'error');
    }
  };

  const handleToggleTestimonial = async (item: Testimonial) => {
    await adminSaveTestimonial({ ...item, isApproved: !item.isApproved }, false);
    showToast(item.isApproved ? 'Testimonial hidden.' : 'Testimonial approved.', 'success');
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0D1121] border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTab('announcements')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${
              tab === 'announcements' ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Announcements ({announcements.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('testimonials')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${
              tab === 'testimonials' ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Testimonials ({testimonials.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('inbox')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${
              tab === 'inbox' ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Contact Inbox ({messages.length})
          </button>
        </div>

        {tab === 'announcements' && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        )}
      </div>

      {tab === 'announcements' && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5 flex items-start justify-between gap-4"
            >
              <div>
                <div className="text-xs text-violet-500 font-semibold uppercase">
                  {ann.priority} · {formatFirestoreDate(ann.createdAt, language)}
                </div>
                <h3 className="font-display text-base font-bold mt-1">
                  {language === 'ar' ? ann.titleAr : ann.titleEn}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {language === 'ar' ? ann.bodyAr : ann.bodyEn}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await adminDeleteAnnouncement(ann.id, user?.email || 'admin');
                  await load();
                }}
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'testimonials' && (
        <div className="space-y-4">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5 flex flex-wrap items-start justify-between gap-4"
            >
              <div className="flex-1">
                <div className="text-sm font-bold">
                  {item.studentName} · <span className="text-violet-500">{item.trackName}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  "{language === 'ar' ? item.quoteAr : item.quoteEn}"
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleTestimonial(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    item.isApproved
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {item.isApproved ? 'Approved' : 'Approve'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await adminDeleteTestimonial(item.id);
                    await load();
                  }}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'inbox' && (
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-8 text-center text-sm text-slate-500">
              No contact inquiries yet.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5 flex flex-wrap items-start justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="text-sm font-bold">{msg.subject}</div>
                  <div className="text-xs text-slate-500">
                    {msg.name} · {msg.email} {msg.phone ? `· ${msg.phone}` : ''}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 pt-1">{msg.message}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await adminResolveContactMessage(
                      msg.id,
                      msg.status === 'new' ? 'resolved' : 'new'
                    );
                    await load();
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    msg.status === 'resolved'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-violet-600 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{msg.status === 'resolved' ? 'Resolved' : 'Mark Resolved'}</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Publish Announcement</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Title (EN)"
                  value={annForm.titleEn}
                  onChange={(e) => setAnnForm({ ...annForm, titleEn: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
                <input
                  type="text"
                  required
                  dir="rtl"
                  placeholder="Title (AR)"
                  value={annForm.titleAr}
                  onChange={(e) => setAnnForm({ ...annForm, titleAr: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                />
              </div>
              <textarea
                rows={3}
                required
                minLength={4}
                placeholder="Body (EN)"
                value={annForm.bodyEn}
                onChange={(e) => setAnnForm({ ...annForm, bodyEn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
              <textarea
                rows={3}
                required
                minLength={4}
                dir="rtl"
                placeholder="Body (AR)"
                value={annForm.bodyAr}
                onChange={(e) => setAnnForm({ ...annForm, bodyAr: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
              />
              <div className="flex items-center justify-between">
                <select
                  value={annForm.priority}
                  onChange={(e) =>
                    setAnnForm({ ...annForm, priority: e.target.value as 'normal' | 'important' })
                  }
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="important">Important Priority</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
                  >
                    Publish
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
