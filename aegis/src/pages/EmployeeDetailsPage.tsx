import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Briefcase, CalendarDays, GitBranch } from 'lucide-react';
import { getEmployee } from '../api/employee.api';
import { getWorkflow, getWorkflows } from '../api/workflow.api';
import { StatusBadge } from '../components/StatusBadge';
import type { Task, Workflow } from '../types';

export function EmployeeDetailsPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['employee', id], queryFn: () => getEmployee(id!), enabled: Boolean(id) });
  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({ queryKey: ['employee-workflows'], queryFn: getWorkflows });

  const employee = data?.data?.employee;
  const workflows: Workflow[] = workflowsData?.data?.workflows ?? [];
  const workflow = workflows.find((entry) => entry.employeeId === employee?._id);

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['employee-workflow-detail', workflow?._id],
    queryFn: () => getWorkflow(workflow!._id),
    enabled: Boolean(workflow)
  });

  const tasks: Task[] = detailData?.data?.tasks ?? [];
  const approvals = detailData?.data?.approvals ?? [];

  if (isLoading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8">Loading employee profile…</div>;
  }

  if (!employee) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8">No employee found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Briefcase className="h-6 w-6" /></div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{employee.name}</h2>
              <p className="text-sm text-slate-500">{employee.role} • {employee.department}</p>
            </div>
          </div>
          <StatusBadge status={employee.status ?? 'Provisioning'} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="text-lg font-semibold">Profile overview</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Email</span><span>{employee.email}</span></div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Location</span><span>{employee.location}</span></div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Clearance</span><span>{employee.clearance}</span></div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span>Joining date</span><span>{employee.joiningDate ?? 'Pending'}</span></div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h3 className="text-lg font-semibold">Current workflow</h3>
          {workflowsLoading ? (
            <p className="mt-4 text-sm text-slate-500">Loading workflow…</p>
          ) : !workflow ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              No onboarding workflow has been generated for this employee yet.
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-brand-50 p-5">
                <div>
                  <p className="text-sm font-semibold text-brand-800">{workflow.title}</p>
                  <p className="mt-1 text-xs text-brand-700">{workflow.summary}</p>
                </div>
                <StatusBadge status={workflow.status ?? 'Pending'} />
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-900">Tasks</p>
                {detailLoading ? (
                  <p className="mt-2 text-sm text-slate-500">Loading tasks…</p>
                ) : tasks.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No tasks generated yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {tasks.map((task) => (
                      <li key={task._id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                        <span className="text-slate-800">{task.title}</span>
                        <StatusBadge status={task.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {approvals.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-900">Approval gates</p>
                  <ul className="mt-2 space-y-2">
                    {approvals.map((approval: any) => (
                      <li key={approval._id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                        <span className="inline-flex items-center gap-2 text-slate-800"><GitBranch className="h-3.5 w-3.5 text-brand-500" />{approval.resource}</span>
                        <StatusBadge status={approval.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4" /> Expected kickoff next business day</div>
        </div>
      </div>
    </div>
  );
}
