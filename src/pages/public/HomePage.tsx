import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  PlayCircle,
  Send,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { SafeImage } from '../../components/common/SafeImage';
import { HERO_IMAGE_PATH } from '../../lib/seedData';
import { contactSchema, formatCurrencyEgp } from '../../lib/validation';
import {
  getAcademySettings,
  getActiveInstructors,
  getApprovedTestimonials,
  getPublishedCourses,
  getPublishedTracks,
  seedAcademyData,
  submitContactMessage,
} from '../../services/firestoreService';
import type {
  AcademySettings,
  Course,
  Instructor,
  LearningTrack,
  Testimonial,
  TrackCategory,
} from '../../types';

export const HomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user, isFirebaseAdmin } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [settings, setSettings] = useState<AcademySettings | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | TrackCategory>('all');
  const [seeding, setSeeding] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tracksData, instData, coursesData, testiData, settingsData] = await Promise.all([
        getPublishedTracks(),
        getActiveInstructors(),
        getPublishedCourses(),
        getApprovedTestimonials(),
        getAcademySettings(),
      ]);
      setTracks(tracksData);
      setInstructors(instData);
      setCourses(coursesData);
      setTestimonials(testiData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Homepage load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && location.hash) {
      const targetId = location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [loading, location.hash]);

  // Auto-seed if signed in as bootstrapped admin and DB is empty
  useEffect(() => {
    if (!loading && isFirebaseAdmin && tracks.length === 0 && !seeding) {
      setSeeding(true);
      seedAcademyData(user?.email || 'admin')
        .then(() => loadData())
        .catch(() => {})
        .finally(() => setSeeding(false));
    }
  }, [loading, isFirebaseAdmin, tracks.length, seeding, user?.email]);

  const instructorMap = useMemo(() => {
    const m = new Map<string, Instructor>();
    instructors.forEach((i) => m.set(i.id, i));
    return m;
  }, [instructors]);

  const trackMap = useMemo(() => {
    const m = new Map<string, LearningTrack>();
    tracks.forEach((tr) => m.set(tr.id, tr));
    return m;
  }, [tracks]);

  const filteredTracks = useMemo(() => {
    if (categoryFilter === 'all') return tracks;
    return tracks.filter((tr) => tr.category === categoryFilter);
  }, [tracks, categoryFilter]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(contactForm);
    if (!parsed.success) {
      showToast(parsed.error.issues[0]?.message || 'Please check your form details.', 'error');
      return;
    }
    setContactSubmitting(true);
    try {
      await submitContactMessage(parsed.data);
      setContactSent(true);
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
      showToast(t.contact.sentSuccess, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message.', 'error');
    } finally {
      setContactSubmitting(false);
    }
  };

  const heroHeadline =
    language === 'ar'
      ? settings?.heroHeadlineAr || t.hero.headline
      : settings?.heroHeadlineEn || t.hero.headline;

  const heroSubtitle =
    language === 'ar'
      ? settings?.heroSubtitleAr || t.hero.subtitle
      : settings?.heroSubtitleEn || t.hero.subtitle;

  const phone = settings?.contactPhone || '01012329975';
  const email = settings?.contactEmail || 'syntaxacademy02@gmail.com';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070912] text-slate-900 dark:text-slate-100">
      <PublicNavbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section id="hero" className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-xs font-semibold tracking-wider uppercase text-violet-600 dark:text-violet-400 mb-4">
                  Syntax Academy · Cairo & Online
                </p>
                <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12] [text-wrap:balance]">
                  {heroHeadline}
                </h1>
                <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  {heroSubtitle}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3.5">
                  <a
                    href="#tracks"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    <span>{t.hero.exploreCta}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </a>
                  <Link
                    to={user ? '/dashboard' : '/register'}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1121] hover:border-violet-500/60 text-slate-900 dark:text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    {user ? t.nav.dashboard : t.hero.joinCta}
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative h-64 sm:h-80 lg:h-full min-h-[320px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
                  <SafeImage
                    src={HERO_IMAGE_PATH}
                    alt="Syntax Academy software engineering studio"
                    className="w-full h-full object-cover"
                    fallbackLabel="Syntax Academy Studio"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070912]/70 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            {/* 4-column metric strip directly below hero split */}
            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8 border-t border-slate-200 dark:border-slate-800/80">
              <div className="p-4 rounded-xl bg-white dark:bg-[#0D1121] border border-slate-200/80 dark:border-slate-800/80">
                <div className="text-2xl font-display font-bold font-mono-tabular text-slate-900 dark:text-white">
                  {tracks.length || 4}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t.hero.statTracks}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-[#0D1121] border border-slate-200/80 dark:border-slate-800/80">
                <div className="text-2xl font-display font-bold font-mono-tabular text-slate-900 dark:text-white">
                  {instructors.length || 3}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t.hero.statInstructors}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-[#0D1121] border border-slate-200/80 dark:border-slate-800/80">
                <div className="text-2xl font-display font-bold font-mono-tabular text-slate-900 dark:text-white">
                  100%
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t.hero.statPractical}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-[#0D1121] border border-slate-200/80 dark:border-slate-800/80">
                <div className="text-2xl font-display font-bold font-mono-tabular text-slate-900 dark:text-white">
                  A4 PDF
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t.hero.statVerified}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="py-16 lg:py-24 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {t.about.kicker}
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white [text-wrap:balance]">
                  {language === 'ar'
                    ? settings?.aboutTitleAr || t.about.title
                    : settings?.aboutTitleEn || t.about.title}
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'ar'
                    ? settings?.aboutBodyAr || t.about.body
                    : settings?.aboutBodyEn || t.about.body}
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1121] border border-slate-200 dark:border-slate-800">
                  <BookOpen className="w-5 h-5 text-violet-500 mb-4" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {t.about.pillar1Title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t.about.pillar1Desc}
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1121] border border-slate-200 dark:border-slate-800">
                  <UserCheck className="w-5 h-5 text-violet-500 mb-4" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {t.about.pillar2Title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t.about.pillar2Desc}
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1121] border border-slate-200 dark:border-slate-800">
                  <ShieldCheck className="w-5 h-5 text-violet-500 mb-4" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {t.about.pillar3Title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t.about.pillar3Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LEARNING TRACKS SECTION (DYNAMIC FROM FIRESTORE) */}
        <section id="tracks" className="py-16 lg:py-24 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {t.tracks.kicker}
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {t.tracks.title}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
                  {t.tracks.subtitle}
                </p>
              </div>

              {/* Interactive Category Filter Segmented Control */}
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0D1121] border border-slate-200 dark:border-slate-800">
                {(
                  [
                    { key: 'all', label: t.tracks.allCategories },
                    { key: 'programming', label: t.tracks.programming },
                    { key: 'office', label: t.tracks.office },
                    { key: 'language', label: t.tracks.language },
                    { key: 'program', label: t.tracks.program },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setCategoryFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      categoryFilter === tab.key
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] animate-pulse"
                  />
                ))}
              </div>
            ) : filteredTracks.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-10 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">{t.tracks.empty}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTracks.map((track) => {
                  const instructor = instructorMap.get(track.instructorId);
                  const savings = Math.max(0, track.originalPrice - track.discountedPrice);
                  const title = language === 'ar' ? track.titleAr : track.titleEn;
                  const description = language === 'ar' ? track.descriptionAr : track.descriptionEn;
                  const duration = language === 'ar' ? track.durationAr : track.durationEn;

                  return (
                    <article
                      key={track.id}
                      className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] overflow-hidden flex flex-col hover:border-violet-500/50 transition-colors"
                    >
                      <div className="aspect-[16/9] overflow-hidden bg-slate-900">
                        <SafeImage
                          src={track.thumbnailUrl}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          fallbackLabel={title}
                        />
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        {/* Unboxed metadata row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          {instructor && (
                            <span>
                              {language === 'ar' ? instructor.nameAr : instructor.nameEn}
                            </span>
                          )}
                          {instructor && duration && <span aria-hidden="true">·</span>}
                          {duration && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {duration}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2 font-display text-xl font-bold text-slate-900 dark:text-white">
                          {title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                          {description}
                        </p>

                        {track.skills && track.skills.length > 0 && (
                          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {track.skills.slice(0, 5).join(' · ')}
                          </p>
                        )}

                        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <div className="flex items-baseline gap-2.5">
                              <span className="text-2xl font-display font-bold font-mono-tabular text-slate-900 dark:text-white">
                                {formatCurrencyEgp(track.discountedPrice, language)}
                              </span>
                              {track.originalPrice > track.discountedPrice && (
                                <span className="text-sm line-through text-slate-400 font-mono-tabular">
                                  {formatCurrencyEgp(track.originalPrice, language)}
                                </span>
                              )}
                            </div>
                            {savings > 0 && (
                              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono-tabular">
                                {t.tracks.save} {formatCurrencyEgp(savings, language)}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              to={`/tracks/${track.slug}`}
                              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                            >
                              {track.applicationsOpen ? t.tracks.applyNow : t.tracks.viewDetails}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* INSTRUCTORS SECTION */}
        <section id="instructors" className="py-16 lg:py-24 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                {t.instructors.kicker}
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {t.instructors.title}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                {t.instructors.subtitle}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] animate-pulse"
                  />
                ))}
              </div>
            ) : instructors.length === 0 ? (
              <p className="text-sm text-slate-500">{t.instructors.empty}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {instructors.map((inst) => {
                  const name = language === 'ar' ? inst.nameAr : inst.nameEn;
                  const spec = language === 'ar' ? inst.specializationAr : inst.specializationEn;
                  const bio = language === 'ar' ? inst.bioAr : inst.bioEn;
                  const ledTracks = tracks.filter((tr) => tr.instructorId === inst.id);
                  const ledCourses = courses.filter((c) => c.instructorId === inst.id);

                  return (
                    <article
                      key={inst.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 flex flex-col"
                    >
                      <div className="flex items-center gap-4">
                        <SafeImage
                          src={inst.avatarUrl}
                          alt={name}
                          className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          fallbackLabel={name}
                        />
                        <div className="min-w-0">
                          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white truncate">
                            {name}
                          </h3>
                          <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-0.5">
                            {spec}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">
                        {bio}
                      </p>
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono-tabular">
                        <span>
                          {ledTracks.length} {t.instructors.tracksLed}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {ledCourses.length} {t.instructors.coursesPublished}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* LATEST COURSES SECTION */}
        <section id="courses" className="py-16 lg:py-24 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                {t.courses.kicker}
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {t.courses.title}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                {t.courses.subtitle}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] animate-pulse"
                  />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <p className="text-sm text-slate-500">{t.courses.empty}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courses.slice(0, 6).map((course) => {
                  const title = language === 'ar' ? course.titleAr : course.titleEn;
                  const desc = language === 'ar' ? course.descriptionAr : course.descriptionEn;
                  const track = trackMap.get(course.trackId);
                  const inst = instructorMap.get(course.instructorId);

                  return (
                    <article
                      key={course.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] overflow-hidden flex flex-col"
                    >
                      <div className="aspect-[16/9] bg-slate-900 overflow-hidden">
                        <SafeImage
                          src={course.thumbnailUrl}
                          alt={title}
                          className="w-full h-full object-cover"
                          fallbackLabel={title}
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                          <span>
                            {track
                              ? language === 'ar'
                                ? track.titleAr
                                : track.titleEn
                              : 'Syntax Track'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {course.isPublicPreview
                              ? t.courses.publicPreview
                              : t.courses.enrolledOnly}
                          </span>
                        </div>
                        <h3 className="mt-2 font-display text-lg font-bold text-slate-900 dark:text-white">
                          {title}
                        </h3>
                        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 flex-1">
                          {desc}
                        </p>
                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {inst ? (language === 'ar' ? inst.nameAr : inst.nameEn) : ''}
                          </span>
                          <Link
                            to={`/courses/${course.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline whitespace-nowrap"
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span>{t.courses.watchCourse}</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        {testimonials.length > 0 && (
          <section className="py-16 lg:py-24 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="max-w-2xl mb-10">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {t.testimonials.kicker}
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {t.testimonials.title}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  {t.testimonials.subtitle}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((item) => (
                  <blockquote
                    key={item.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 flex flex-col justify-between"
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      "{language === 'ar' ? item.quoteAr : item.quoteEn}"
                    </p>
                    <footer className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.studentName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.trackName}
                      </div>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CONTACT SECTION */}
        <section id="contact" className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {t.contact.kicker}
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {t.contact.title}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.contact.subtitle}
                </p>

                <div className="mt-8 space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121]">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t.contact.phoneLabel}
                    </div>
                    <a
                      href={`tel:${phone}`}
                      className="mt-1 inline-flex items-center gap-2 text-base font-semibold font-mono-tabular text-slate-900 dark:text-white hover:text-violet-500"
                    >
                      <Phone className="w-4 h-4 text-violet-500" />
                      <span>{phone}</span>
                    </a>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121]">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t.contact.emailLabel}
                    </div>
                    <a
                      href={`mailto:${email}`}
                      className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white hover:text-violet-500"
                    >
                      <Mail className="w-4 h-4 text-violet-500" />
                      <span>{email}</span>
                    </a>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121]">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t.contact.hoursLabel}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                      {t.contact.hoursValue}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <form
                  onSubmit={handleContactSubmit}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1121] p-6 sm:p-8 space-y-4"
                >
                  {contactSent && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{t.contact.sentSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {t.contact.nameLabel}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {t.contact.emailInput}
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {t.contact.phoneInput}
                      </label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {t.contact.subjectLabel}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.contact.messageLabel}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070912] text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    <span>{contactSubmitting ? t.common.loading : t.contact.sendCta}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} tracks={tracks} />
    </div>
  );
};
