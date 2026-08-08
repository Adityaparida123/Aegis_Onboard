import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import { approveApproval, getApprovals, rejectApproval } from '../api/approval.api';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import type { ApprovalItem } from '../types';

export function ApprovalsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['approvals'], queryFn: getApprovals });
  const approvals: ApprovalItem[] = data?.data?.approvals ?? [];
  const pending = approvals.filter((approval) => approval.status === 'Pending');
  const decided = approvals.filter((approval) => approval.status !== 'Pending');

  async function handleDecision(approvalId: string, decision: 'approve' | 'reject') {
    try {
      if (decision === 'approve') {
        await approveApproval(approvalId);
        toast.success('Approval granted');
      } else {
        await rejectApproval(approvalId);
        toast.success('Approval rejected');
      }
      await queryClient.invalidateQueries({ queryKey: ['approvals'] });
    } catch (error) {
      toast.error('Approval update failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-300">Human approvals</p>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Approval center</h2>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">{pending.length} pending</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Pending requests</h3>

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading approvals…</p>
        ) : pending.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No pending approval requests" description="All approval gates are resolved." icon={<ShieldAlert className="h-6 w-6" />} />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((approval) => (
              <li key={approval._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between dark:border-slate-700 dark:bg-slate-800/60">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{approval.resource}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Workflow {approval.workflowId} · requested by {approval.requestedBy ?? 'system'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={approval.status} />
                  <button
                    onClick={() => handleDecision(approval._id, 'approve')}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />Approve
                  </button>
                  <button
                    onClick={() => handleDecision(approval._id, 'reject')}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
                  >
                    <XCircle className="h-4 w-4" />Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Decision history</h3>
        {decided.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No decisions recorded yet" description="Approved and rejected requests will appear here." />
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {decided.map((approval) => (
              <li key={approval._id} className="flex flex-col gap-2 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                <p className="text-sm text-slate-800 dark:text-slate-200">{approval.resource}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{approval.requestedBy ?? 'system'}</span>
                  <StatusBadge status={approval.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
