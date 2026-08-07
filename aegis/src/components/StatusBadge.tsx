interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    Completed: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700',
    'Waiting Approval': 'bg-sky-100 text-sky-700',
    Failed: 'bg-rose-100 text-rose-700',
    'In Progress': 'bg-indigo-100 text-indigo-700',
    Cancelled: 'bg-slate-100 text-slate-700'
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}
