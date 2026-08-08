interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Waiting Approval': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    Failed: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    'In Progress': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    Cancelled: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{status}</span>;
}
