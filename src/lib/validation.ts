import { z } from 'zod';
import type { FirestoreTimestampLike, Language } from '../types';

export const ID_REGEX = /^[a-zA-Z0-9_-]+$/;
export const SLUG_REGEX = /^[a-z0-9-]+$/;

export const applicationSchema = z.object({
  studentName: z.string().trim().min(2).max(120),
  studentEmail: z.string().trim().email().max(200),
  studentPhone: z.string().trim().min(6).max(40),
  trackId: z.string().trim().regex(ID_REGEX).max(128),
  message: z.string().trim().max(1500).optional().default(''),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(''),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(5).max(2000),
});

export const commentSchema = z.object({
  content: z.string().trim().min(2).max(1000),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().default(''),
  bio: z.string().trim().max(500).optional().default(''),
  avatarUrl: z.string().trim().max(1000).optional().default(''),
});

export function sanitizeText(input: string, maxLen: number): string {
  return input.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

export function generateId(prefix = 'doc'): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function formatFirestoreDate(ts: FirestoreTimestampLike | undefined, lang: Language): string {
  if (!ts) return '—';
  let date: Date | null = null;
  if (typeof ts.toDate === 'function') {
    date = ts.toDate();
  } else if (typeof ts.seconds === 'number') {
    date = new Date(ts.seconds * 1000);
  }
  if (!date || Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function extractYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        return `https://www.youtube.com/embed/${parsed.pathname.split('/')[2]}`;
      }
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{6,20}$/.test(v)) {
        return `https://www.youtube.com/embed/${v}`;
      }
    }
    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      if (id && /^[a-zA-Z0-9_-]{6,20}$/.test(id)) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }
    if (host === 'player.vimeo.com' && parsed.pathname.startsWith('/video/')) {
      return url;
    }
  } catch {
    return null;
  }
  return null;
}

export function formatCurrencyEgp(amount: number, lang: Language): string {
  const formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(amount);
  return lang === 'ar' ? `${formatted} جنيه` : `${formatted} EGP`;
}
