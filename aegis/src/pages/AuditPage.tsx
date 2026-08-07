import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditHistory } from '../api/audit.api';

export function AuditPage() {
  const [workflowId, setWorkflowId] = useState('demo');
  const { data, isLoading } = useQuery({ queryKey: ['audit', workflowId], queryFn: () => getAuditHistory(workflowId), enabled: Boolean(workflowId) });
  const history = data?.data?.history ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600">Auditability</p>
            <h2 className="text-2xl font-semibold text-slate-900">Audit logs</h2>
          </div>
          <input className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" placeholder="Workflow ID" value={workflowId} onChange={(e) => setWorkflowId(e.target.value)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? <tr><td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>Loading audit history…</td></tr> : history.map((entry: any) => (
              <tr key={entry._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-600">{entry.createdAt ?? 'n/a'}</td>
                <td className="px-4 py-3 text-sm text-slate-800">{entry.action}</td>
                <td className="px-4 py-3 text-sm text-slate-800">{entry.actor}</td>
                <td className="px-4 py-3 text-sm text-slate-800">{entry.result ?? 'Logged'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
