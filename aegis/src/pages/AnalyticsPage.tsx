import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { getDashboardStats } from '../api/dashboard.api';
import { StatCard } from '../components/StatCard';
import type { DashboardStats } from '../types';

const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  'In Progress': '#3b82f6',
  'Waiting Approval': '#0ea5e9',
  Completed: '#10b981',
  Failed: '#ef4444',
  Cancelled: '#94a3b8'
};

export function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: getDashboardStats });
  const stats: DashboardStats | undefined = data?.data;

  if (isLoading || !stats) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">Loading analytics…</div>;
  }

  const statusData = Object.entries(stats.workflowStatusDistribution ?? {}).map(([name, value]) => ({ name, value }));
  const departmentData = Object.entries(stats.tasksByDepartment ?? {}).map(([name, tasks]) => ({ name, tasks }));
  const dailyData = Object.entries(stats.dailyOnboardings ?? {}).map(([date, count]) => ({ date, count }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending workflows" value={stats.pendingWorkflows} />
        <StatCard label="In progress" value={stats.inProgressWorkflows} />
        <StatCard label="Completed" value={stats.completedWorkflows} />
        <StatCard label="Approval rate" value={`${stats.approvalRate}%`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Workflow status distribution</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {statusData.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tasks by department</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Daily onboardings (last 7 days)</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#0ea5e9" fill="#e0f2fe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Throughput</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Failed workflows</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{stats.failedWorkflows}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Avg completion</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{stats.averageCompletionTime}m</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Approvals</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{stats.totalApprovals}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending approvals</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
