import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Terminal } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { AcademySettings, LearningTrack } from '../../types';

interface PublicFooterProps {
  settings?: AcademySettings | null;
  tracks?: LearningTrack[];
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ settings, tracks = [] }) => {
  const { language, t } = useLanguage();
  const phone = settings?.contactPhone || '01012329975';
  const email = settings?.contactEmail || 'syntaxacademy02@gmail.com';

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#05070E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-lg font-display font-bold text-slate-900 dark:text-white"
            >
              <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center">
                <Terminal className="w-4 h-4" />
              </span>
              <span>{settings?.academyName || t.brand}</span>
            </Link>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              {t.footer.quickLinks}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <a href="/#about" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  {t.nav.about}
                </a>
              </li>
              <li>
                <a href="/#instructors" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  {t.nav.instructors}
                </a>
              </li>
              <li>
                <a href="/#courses" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  {t.nav.courses}
                </a>
              </li>
              <li>
                <Link to="/verify-certificate" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  {t.nav.verify}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  {t.nav.login}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              {t.footer.tracksHeading}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              {tracks.slice(0, 5).map((track) => (
                <li key={track.id}>
                  <Link
                    to={`/tracks/${track.slug}`}
                    className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    {language === 'ar' ? track.titleAr : track.titleEn}
                  </Link>
                </li>
              ))}
              {tracks.length === 0 && (
                <>
                  <li>Frontend Development</li>
                  <li>Backend Development</li>
                  <li>Full Stack Development</li>
                  <li>Microsoft Office</li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              {t.footer.contactHeading}
            </h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-mono-tabular"
                >
                  <Phone className="w-4 h-4 text-violet-500" />
                  <span>{phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-2 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  <Mail className="w-4 h-4 text-violet-500" />
                  <span>{email}</span>
                </a>
              </li>
            </ul>
            {settings?.socialLinks && (
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                {settings.socialLinks.facebook && (
                  <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-violet-500">
                    Facebook
                  </a>
                )}
                {settings.socialLinks.whatsapp && (
                  <a href={settings.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-violet-500">
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            © {new Date().getFullYear()} {settings?.academyName || 'Syntax Academy'}. {t.footer.rights}
          </p>
          <Link to="/admin/login" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  );
};
