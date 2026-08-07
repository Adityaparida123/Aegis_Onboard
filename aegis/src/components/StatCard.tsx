import type { ReactNode } from 'react';

interface StatCardProps {
  label?: string;
  title?: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  accent?: 'brand' | 'warning' | 'success' | 'info' | 'danger';
}

const accentStyles: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'bg-brand-50 text-brand-600',
  warning: 'bg-amber-50 text-amber-600',
  success: 'bg-emerald-50 text-emerald-600',
  info: 'bg-sky-50 text-sky-600',
  danger: 'bg-rose-50 text-rose-600'
};

export function StatCard({ title, label, value, helper, icon, accent = 'brand' }: StatCardProps) {
  const heading = title ?? label;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{heading}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        {icon ? <div className={`rounded-xl p-3 ${accentStyles[accent]}`}>{icon}</div> : null}
      </div>
      {helper ? <p className="mt-3 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}
