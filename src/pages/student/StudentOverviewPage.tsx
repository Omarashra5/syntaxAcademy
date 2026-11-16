import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  Megaphone,
  Phone,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatFirestoreDate } from '../../lib/validation';
import {
  getPublishedAnnouncements,
  getStudentApplications,
  getStudentCertificates,
  getStudentEnrollments,
  subscribeToNotifications,
} from '../../services/firestoreService';
import type {
  Announcement,
  Application,
  Certificate,
  Enrollment,
  NotificationItem,
} from '../../types';

export const StudentOverviewPage: React.FC = () => {
  const { user, studentProfile } = useAuth();
  const { language, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      getStudentApplications(user.uid),
      getStudentEnrollments(user.uid),
      getStudentCertificates(user.uid),
      getPublishedAnnouncements(),
    ])
      .then(([apps, enrolls, certs, anns]) => {
        setApplications(apps);
        setEnrollments(enrolls);
        setCertificates(certs);
        setAnnouncements(anns);
      })
      .finally(() => setLoading(false));

    const unsub = subscribeToNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user]);

  const completedLessonsCount = enrollments.reduce(
    (sum, en) => sum + (en.completedLessonIds?.length || 0),
    0
  );
  const acceptedApps = applications.filter((a) => a.status === 'accepted');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">
            {t.student.welcome}, {studentProfile?.fullName || user?.displayName || 'Student'}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {studentProfile?.email || user?.email}
          </p>
        </div>
        <Link
          to="/dashboard/applications"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
        >
          {t.tracks.applyNow}
        </Link>
      </div>

      {/* Prominent Acceptance Banners */}
      {acceptedApps.map((app) => {
        const trackTitle = language === 'ar' ? app.trackTitleAr : app.trackTitleEn;
        return (
          <div
            key={app.id}
            className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 space-y-3"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                  {language === 'ar'
                    ? `تهانينا! تم قبول طلبك في مسار ${trackTitle}`
                    : `Congratulations! Your application for ${trackTitle} at Syntax Academy has been accepted.`}
                </h3>
                <p className="text-sm text-emerald-900/90 dark:text-emerald-100/90 leading-relaxed">
                  {language === 'ar'
                    ? 'يرجى التواصل معنا على 01012329975 لاستلام نموذج Google Form المطلوب لإتمام تسجيلك.'
                    : 'Please contact us at 01012329975 to receive the Google Form required to complete your registration.'}
                </p>
                {app.adminMessage && (
                  <p className="text-xs text-emerald-800 dark:text-emerald-200 bg-white/60 dark:bg-black/20 rounded-lg px-3 py-2">
                    {app.adminMessage}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="tel:01012329975"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>01012329975</span>
                  </a>
                  {app.googleFormUrl && (
                    <a
                      href={app.googleFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t.application.openGoogleForm}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5">
          <FileText className="w-5 h-5 text-violet-500 mb-3" />
          <div className="text-2xl font-display font-bold font-mono-tabular">
            {loading ? '—' : applications.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.student.appliedTracks}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5">
          <BookOpen className="w-5 h-5 text-violet-500 mb-3" />
          <div className="text-2xl font-display font-bold font-mono-tabular">
            {loading ? '—' : enrollments.filter((e) => e.status === 'active').length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.student.enrolledCourses}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-3" />
          <div className="text-2xl font-display font-bold font-mono-tabular">
            {loading ? '—' : completedLessonsCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.student.completedLessons}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5">
          <Award className="w-5 h-5 text-amber-500 mb-3" />
          <div className="text-2xl font-display font-bold font-mono-tabular">
            {loading ? '—' : certificates.filter((c) => c.status === 'valid').length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.student.earnedCertificates}
          </div>
        </div>
      </div>

      {/* Announcements & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-violet-500" />
            <h3 className="font-display text-base font-bold">{t.student.announcements}</h3>
          </div>
          {announcements.length === 0 ? (
            <p className="text-sm text-slate-500">No announcements right now.</p>
          ) : (
            <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
              {announcements.slice(0, 4).map((ann) => (
                <div key={ann.id} className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">
                      {language === 'ar' ? ann.titleAr : ann.titleEn}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono-tabular">
                      {formatFirestoreDate(ann.createdAt, language)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {language === 'ar' ? ann.bodyAr : ann.bodyEn}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6">
          <h3 className="font-display text-base font-bold mb-4">
            {t.student.recentNotifications}
          </h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500">{t.notifications.empty}</p>
          ) : (
            <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {language === 'ar' ? n.titleAr : n.titleEn}
                    </p>
                    <span className="text-[11px] text-slate-400 font-mono-tabular">
                      {formatFirestoreDate(n.createdAt, language)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line">
                    {language === 'ar' ? n.bodyAr : n.bodyEn}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold">{t.student.applications}</h3>
          <Link
            to="/dashboard/applications"
            className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
          >
            {t.common.all} →
          </Link>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-slate-500">{t.student.noApplications}</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {applications.slice(0, 5).map((app) => (
              <div key={app.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    {language === 'ar' ? app.trackTitleAr : app.trackTitleEn}
                  </div>
                  <div className="text-xs text-slate-500 font-mono-tabular">
                    {formatFirestoreDate(app.createdAt, language)}
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
