import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
      {icon ? <div className="mb-3 text-slate-400 dark:text-slate-500">{icon}</div> : null}
      <p className="text-base font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
    </div>
  );
}
