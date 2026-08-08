import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, BadgeCheck, Clock3, ShieldAlert } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDashboardStats } from '../api/dashboard.api';
import { StatCard } from '../components/StatCard';
import { useDashboardStore } from '../store/dashboardStore';

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardStats });
  const setStats = useDashboardStore((state) => state.setStats);

  useEffect(() => {
    if (data?.data) {
      setStats(data.data);
    }
  }, [data, setStats]);

  const stats = data?.data;
  const workload: Array<{ name: string; value: number }> = Object.entries(stats?.tasksByDepartment ?? {}).map(([name, value]) => ({ name, value: Number(value) }));
  const workloadMax = workload.reduce((max, item) => Math.max(max, item.value), 0) || 1;

  if (isLoading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600 dark:text-brand-300">Operations overview</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Executive dashboard</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active workflows" value={stats?.pendingWorkflows ?? 0} helper="Workflows currently in motion" icon={<Activity className="h-5 w-5" />} accent="brand" />
        <StatCard title="Pending approvals" value={stats?.pendingApprovals ?? 0} helper="Human approvals awaiting review" icon={<ShieldAlert className="h-5 w-5" />} accent="warning" />
        <StatCard title="Completed today" value={stats?.completedWorkflows ?? 0} helper="Completed onboarding tasks" icon={<BadgeCheck className="h-5 w-5" />} accent="success" />
        <StatCard title="Average completion time" value={`${stats?.averageCompletionTime ?? 0}m`} helper="Average workflow duration" icon={<Clock3 className="h-5 w-5" />} accent="info" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Workflow status</h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">Live distribution</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={Object.entries(stats?.workflowStatusDistribution ?? {}).map(([name, value]) => ({ name, value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {Object.entries(stats?.workflowStatusDistribution ?? {}).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#0ea5e9'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Department workload</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Current departmental allocation</p>
          </div>
          <div className="space-y-4">
            {workload.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No task data yet.</p>
            ) : (
              workload.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(item.value / workloadMax) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
