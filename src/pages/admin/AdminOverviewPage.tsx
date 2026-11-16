import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Layers,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { formatFirestoreDate } from '../../lib/validation';
import { adminGetAllCollections, seedAcademyData } from '../../services/firestoreService';
import type {
  Application,
  Certificate,
  Course,
  Instructor,
  LearningTrack,
  StudentUser,
} from '../../types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  under_review: '#0EA5E9',
  accepted: '#10B981',
  enrolled: '#7C3AED',
  rejected: '#EF4444',
};

export const AdminOverviewPage: React.FC = () => {
  const { user, isFirebaseAdmin } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const loadStats = async () => {
    if (!isFirebaseAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await adminGetAllCollections();
      setStudents(data.students);
      setApplications(data.applications);
      setTracks(data.tracks);
      setInstructors(data.instructors);
      setCourses(data.courses);
      setCertificates(data.certificates);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [isFirebaseAdmin]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedAcademyData(user?.email || 'admin');
      showToast('Initial Syntax Academy tracks, instructors, and settings seeded.', 'success');
      await loadStats();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Seeding failed.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const acceptedCount = applications.filter(
    (a) => a.status === 'accepted' || a.status === 'enrolled'
  ).length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;
  const publishedCoursesCount = courses.filter((c) => c.isPublished && !c.isArchived).length;

  const appsByTrack = useMemo(() => {
    const counts = new Map<string, number>();
    applications.forEach((a) => {
      const label = language === 'ar' ? a.trackTitleAr : a.trackTitleEn;
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [applications, language]);

  const appsOverTime = useMemo(() => {
    const counts = new Map<string, number>();
    applications.forEach((a) => {
      const dateStr = formatFirestoreDate(a.createdAt, 'en');
      counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
  }, [applications]);

  const statusDistribution = useMemo(() => {
    const statuses = ['pending', 'under_review', 'accepted', 'enrolled', 'rejected'] as const;
    return statuses
      .map((s) => ({
        name: t.statuses[s],
        key: s,
        value: applications.filter((a) => a.status === s).length,
      }))
      .filter((item) => item.value > 0);
  }, [applications, t.statuses]);

  const kpis = [
    { label: t.admin.totalStudents, value: students.length, Icon: Users },
    { label: t.admin.totalApplications, value: applications.length, Icon: FileText },
    { label: t.admin.pendingApps, value: pendingCount, Icon: Clock },
    { label: t.admin.acceptedApps, value: acceptedCount, Icon: CheckCircle2 },
    { label: t.admin.rejectedApps, value: rejectedCount, Icon: XCircle },
    { label: t.admin.totalTracks, value: tracks.filter((tr) => !tr.isArchived).length, Icon: Layers },
    { label: t.admin.publishedCourses, value: publishedCoursesCount, Icon: BookOpen },
    { label: t.admin.totalInstructors, value: instructors.length, Icon: UserCheck },
    { label: t.admin.issuedCerts, value: certificates.length, Icon: Award },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold">{t.admin.overview}</h2>
        {isFirebaseAdmin && (
          <button
            type="button"
            disabled={seeding}
            onClick={handleSeed}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors disabled:opacity-60"
          >
            <Database className="w-4 h-4" />
            <span>{seeding ? t.common.loading : t.admin.seedButton}</span>
          </button>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.Icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-4"
            >
              <Icon className="w-4 h-4 text-violet-500 mb-2.5" />
              <div className="text-2xl font-display font-bold font-mono-tabular">
                {loading ? '—' : kpi.value}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5">
          <h3 className="font-display text-sm font-bold mb-4">Applications Over Time</h3>
          {appsOverTime.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">No applications recorded yet.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5">
          <h3 className="font-display text-sm font-bold mb-4">Applications by Learning Track</h3>
          {appsByTrack.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">No track applications yet.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appsByTrack}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-5">
          <h3 className="font-display text-sm font-bold mb-4">Status Distribution</h3>
          {statusDistribution.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">No status data yet.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {statusDistribution.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={STATUS_COLORS[entry.key] || '#7C3AED'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6">
          <h3 className="font-display text-base font-bold mb-4">Recent Applications</h3>
          {applications.length === 0 ? (
            <p className="text-sm text-slate-500">No applications yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {applications.slice(0, 6).map((app) => (
                <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{app.studentName}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {language === 'ar' ? app.trackTitleAr : app.trackTitleEn} · {app.studentPhone}
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6">
          <h3 className="font-display text-base font-bold mb-4">Recent Student Registrations</h3>
          {students.length === 0 ? (
            <p className="text-sm text-slate-500">No registered students yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {students.slice(0, 6).map((st) => (
                <div key={st.uid} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{st.fullName}</div>
                    <div className="text-xs text-slate-500 truncate">{st.email}</div>
                  </div>
                  <StatusBadge status={st.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
