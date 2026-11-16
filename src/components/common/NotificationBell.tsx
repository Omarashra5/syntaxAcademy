import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ExternalLink, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatFirestoreDate } from '../../lib/validation';
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from '../../services/firestoreService';
import type { NotificationItem } from '../../types';

interface NotificationBellProps {
  recipientUid: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ recipientUid }) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!recipientUid) return;
    const unsub = subscribeToNotifications(recipientUid, (data) => {
      setItems(data);
    });
    return () => unsub();
  }, [recipientUid]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = items.filter((i) => !i.isRead).length;

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markNotificationRead(item.id);
    }
    if (item.actionUrl) {
      setOpen(false);
      navigate(item.actionUrl);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] text-slate-700 dark:text-slate-300 hover:border-violet-500/50 transition-colors"
        aria-label={t.notifications.title}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -end-1.5 min-w-5 h-5 px-1 rounded-full bg-violet-600 text-white text-[11px] font-mono-tabular font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t.notifications.title} ({unreadCount})
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsRead(items)}
                className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t.notifications.markAllRead}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {t.notifications.empty}
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`px-4 py-3.5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                    !item.isRead ? 'bg-violet-500/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {language === 'ar' ? item.titleAr : item.titleEn}
                    </p>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {language === 'ar' ? item.bodyAr : item.bodyEn}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {item.phoneNumber && (
                      <a
                        href={`tel:${item.phoneNumber}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        {item.phoneNumber}
                      </a>
                    )}
                    {item.googleFormUrl && (
                      <a
                        href={item.googleFormUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {t.application.openGoogleForm}
                      </a>
                    )}
                    <span className="text-[11px] text-slate-400 ms-auto font-mono-tabular">
                      {formatFirestoreDate(item.createdAt, language)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
