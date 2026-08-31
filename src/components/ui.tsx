import { Loader2, type LucideIcon } from 'lucide-react';
import { classNames } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={classNames('h-5 w-5 animate-spin', className)} />;
}

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-secondary-50">
      <Spinner className="h-8 w-8 text-primary-600" />
      <p className="text-sm text-secondary-500">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="h-14 w-14 rounded-2xl bg-secondary-100 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-secondary-400" />
      </div>
      <h3 className="text-base font-semibold text-secondary-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-secondary-500 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ScoreRing({ score, size = 44 }: { score: number | null; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score !== null ? Math.max(0, Math.min(100, score)) : 0;
  const offset = circumference - (pct / 100) * circumference;
  const color = score === null ? '#cbd5e1' : score >= 80 ? '#059669' : score >= 60 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-secondary-700">
        {score !== null ? score : '—'}
      </span>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-secondary-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
