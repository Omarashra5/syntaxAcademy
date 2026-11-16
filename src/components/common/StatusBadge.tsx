import React from 'react';
import { CheckCircle2, Clock, Eye, ShieldAlert, XCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { ApplicationStatus, PaymentStatus } from '../../types';

interface StatusBadgeProps {
  status: ApplicationStatus | PaymentStatus | 'valid' | 'revoked' | 'active' | 'suspended';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { language, t } = useLanguage();

  const map: Record<
    string,
    { label: string; colorClass: string; Icon: React.FC<{ className?: string }> }
  > = {
    pending: {
      label: t.statuses.pending,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      Icon: Clock,
    },
    under_review: {
      label: t.statuses.under_review,
      colorClass: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
      Icon: Eye,
    },
    accepted: {
      label: t.statuses.accepted,
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      Icon: CheckCircle2,
    },
    enrolled: {
      label: t.statuses.enrolled,
      colorClass: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20',
      Icon: CheckCircle2,
    },
    rejected: {
      label: t.statuses.rejected,
      colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      Icon: XCircle,
    },
    paid: {
      label: t.statuses.paid,
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      Icon: CheckCircle2,
    },
    partially_paid: {
      label: t.statuses.partially_paid,
      colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      Icon: Clock,
    },
    valid: {
      label: language === 'ar' ? 'سارية وموثقة' : 'Valid',
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      Icon: CheckCircle2,
    },
    revoked: {
      label: language === 'ar' ? 'ملغاة' : 'Revoked',
      colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      Icon: ShieldAlert,
    },
    active: {
      label: language === 'ar' ? 'نشط' : 'Active',
      colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      Icon: CheckCircle2,
    },
    suspended: {
      label: language === 'ar' ? 'موقوف' : 'Suspended',
      colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      Icon: ShieldAlert,
    },
  };

  const entry = map[status] || map.pending;
  const Icon = entry.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 ${entry.colorClass}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{entry.label}</span>
    </span>
  );
};
