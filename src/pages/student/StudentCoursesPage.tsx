import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, PlayCircle, Unlock } from 'lucide-react';
import { SafeImage } from '../../components/common/SafeImage';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getPublishedCourses,
  getPublishedTracks,
  getStudentEnrollments,
} from '../../services/firestoreService';
import type { Course, Enrollment, LearningTrack } from '../../types';

export const StudentCoursesPage: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([getPublishedCourses(), getStudentEnrollments(user.uid), getPublishedTracks()])
      .then(([c, e, tr]) => {
        setCourses(c);
        setEnrollments(e);
        setTracks(tr);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const activeTrackIds = new Set(
    enrollments.filter((e) => e.status === 'active' || e.status === 'completed').map((e) => e.trackId)
  );

  const visibleCourses = courses.filter(
    (c) => activeTrackIds.has(c.trackId) || c.isPublicPreview
  );

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">{t.student.courses}</h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] animate-pulse"
            />
          ))}
        </div>
      ) : visibleCourses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-10 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t.student.noCourses}</p>
          <Link
            to="/dashboard/applications"
            className="inline-block px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold"
          >
            {t.tracks.applyNow}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCourses.map((course) => {
            const unlocked = activeTrackIds.has(course.trackId);
            const track = tracks.find((tr) => tr.id === course.trackId);
            const title = language === 'ar' ? course.titleAr : course.titleEn;
            const desc = language === 'ar' ? course.descriptionAr : course.descriptionEn;

            return (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/9] bg-slate-900">
                  <SafeImage
                    src={course.thumbnailUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                    fallbackLabel={title}
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{track ? (language === 'ar' ? track.titleAr : track.titleEn) : ''}</span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      {unlocked ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Enrolled</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t.courses.publicPreview}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 flex-1">
                    {desc}
                  </p>
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      to={`/courses/${course.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>{t.courses.watchCourse}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
