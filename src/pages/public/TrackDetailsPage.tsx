import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Send,
} from 'lucide-react';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { SafeImage } from '../../components/common/SafeImage';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { applicationSchema, formatCurrencyEgp } from '../../lib/validation';
import {
  getActiveInstructors,
  getTrackBySlug,
  submitTrackApplication,
} from '../../services/firestoreService';
import type { Instructor, LearningTrack } from '../../types';

export const TrackDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const { user, studentProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<LearningTrack | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Application form
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (studentProfile || user) {
      setStudentName(studentProfile?.fullName || user?.displayName || '');
      setStudentEmail(studentProfile?.email || user?.email || '');
      setStudentPhone(studentProfile?.phone || '');
    }
  }, [studentProfile, user]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([getTrackBySlug(slug), getActiveInstructors()])
      .then(([tr, insts]) => {
        setTrack(tr);
        if (tr) {
          setInstructor(insts.find((i) => i.id === tr.instructorId) || null);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !track) {
      navigate('/login', { state: { from: `/tracks/${slug}` } });
      return;
    }

    const parsed = applicationSchema.safeParse({
      studentName,
      studentEmail,
      studentPhone,
      trackId: track.id,
      message,
    });
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || 'Please complete all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await submitTrackApplication({
        studentUid: user.uid,
        studentName: parsed.data.studentName,
        studentEmail: parsed.data.studentEmail,
        studentPhone: parsed.data.studentPhone,
        track,
        message: parsed.data.message,
      });
      setSubmitted(true);
      showToast(t.application.submittedSuccess, 'success');
    } catch (err) {
      if (err instanceof Error && err.message === 'DUPLICATE_PENDING_APPLICATION') {
        showToast(t.application.duplicateWarning, 'error');
      } else {
        showToast(err instanceof Error ? err.message : 'Unable to submit application.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070912]">
        <PublicNavbar />
        <div className="max-w-6xl mx-auto w-full px-4 py-16 space-y-6">
          <div className="h-64 rounded-2xl bg-white dark:bg-[#0D1121] animate-pulse" />
          <div className="h-96 rounded-2xl bg-white dark:bg-[#0D1121] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070912]">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-display font-bold mb-2">Track Not Found</h1>
            <Link to="/" className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              {t.tracks.backToTracks}
            </Link>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const title = language === 'ar' ? track.titleAr : track.titleEn;
  const description = language === 'ar' ? track.descriptionAr : track.descriptionEn;
  const duration = language === 'ar' ? track.durationAr : track.durationEn;
  const objectives = language === 'ar' ? track.objectivesAr || [] : track.objectivesEn || [];
  const savings = Math.max(0, track.originalPrice - track.discountedPrice);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070912] text-slate-900 dark:text-slate-100">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 lg:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 mb-6"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t.tracks.backToTracks}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 columns: Overview, Objectives, Curriculum, Instructor, FAQs */}
          <div className="lg:col-span-7 space-y-8">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] overflow-hidden">
              <div className="aspect-[16/9] bg-slate-900">
                <SafeImage
                  src={track.thumbnailUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  fallbackLabel={title}
                />
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{t.tracks.overview}</span>
                  {duration && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {duration}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="mt-2 font-display text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  {title}
                </h1>
                <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {description}
                </p>

                {track.technologies && track.technologies.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      {t.tracks.technologies}
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {track.technologies.join(' · ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {objectives.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold mb-4">{t.tracks.objectives}</h2>
                <ul className="space-y-3">
                  {objectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {track.curriculum && track.curriculum.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold mb-4">{t.tracks.curriculum}</h2>
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {track.curriculum.map((sec, idx) => {
                    const secTitle = language === 'ar' ? sec.titleAr : sec.titleEn;
                    const topics = language === 'ar' ? sec.topicsAr : sec.topicsEn;
                    return (
                      <div key={idx} className="py-4 first:pt-0 last:pb-0">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {secTitle}
                        </h3>
                        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                          {topics.join(' · ')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {instructor && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 sm:p-8">
                <div className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-3">
                  {t.tracks.instructor}
                </div>
                <div className="flex items-center gap-4">
                  <SafeImage
                    src={instructor.avatarUrl}
                    alt={language === 'ar' ? instructor.nameAr : instructor.nameEn}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0"
                  />
                  <div>
                    <h3 className="font-display text-lg font-bold">
                      {language === 'ar' ? instructor.nameAr : instructor.nameEn}
                    </h3>
                    <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                      {language === 'ar' ? instructor.specializationAr : instructor.specializationEn}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'ar' ? instructor.bioAr : instructor.bioEn}
                </p>
              </div>
            )}

            {track.faqs && track.faqs.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold mb-4">{t.tracks.faqs}</h2>
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {track.faqs.map((faq, idx) => (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between gap-3 text-start text-sm font-semibold text-slate-900 dark:text-white"
                      >
                        <span>{language === 'ar' ? faq.questionAr : faq.questionEn}</span>
                        {openFaq === idx ? (
                          <ChevronUp className="w-4 h-4 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 shrink-0" />
                        )}
                      </button>
                      {openFaq === idx && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {language === 'ar' ? faq.answerAr : faq.answerEn}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 5 columns: Pricing & Application Form */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 sm:p-8 shadow-xl">
              <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-display font-bold font-mono-tabular text-slate-900 dark:text-white">
                    {formatCurrencyEgp(track.discountedPrice, language)}
                  </span>
                  {track.originalPrice > track.discountedPrice && (
                    <span className="text-base line-through text-slate-400 font-mono-tabular">
                      {formatCurrencyEgp(track.originalPrice, language)}
                    </span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono-tabular">
                    {t.tracks.save} {formatCurrencyEgp(savings, language)}
                  </p>
                )}
              </div>

              <div className="mt-6">
                <h2 className="font-display text-lg font-bold mb-4">{t.tracks.applyHeading}</h2>

                {!track.applicationsOpen ? (
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-sm text-slate-600 dark:text-slate-300">
                    {t.tracks.applicationsClosed}
                  </div>
                ) : !user ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {t.application.loginRequired}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <Link
                        to="/login"
                        state={{ from: `/tracks/${slug}` }}
                        className="flex-1 text-center px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                      >
                        {t.nav.login}
                      </Link>
                      <Link
                        to="/register"
                        state={{ from: `/tracks/${slug}` }}
                        className="flex-1 text-center px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {t.nav.register}
                      </Link>
                    </div>
                  </div>
                ) : submitted ? (
                  <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>{t.application.submittedSuccess}</span>
                    </div>
                    <Link
                      to="/dashboard/applications"
                      className="inline-block text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      {t.student.applications} →
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleApplySubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {t.application.fullName}
                      </label>
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {t.application.email}
                      </label>
                      <input
                        type="email"
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {t.application.phone}
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="01012345678"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {t.application.message}
                      </label>
                      <textarea
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? t.application.submitting : t.application.submit}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
