import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Background, BackgroundVariant, Controls, Handle, MiniMap, Position, ReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, PlusCircle } from 'lucide-react';
import { createWorkflow, getWorkflow, getWorkflows } from '../api/workflow.api';
import { getEmployees } from '../api/employee.api';
import { StatusBadge } from '../components/StatusBadge';
import { toast } from 'sonner';
import type { Task, Workflow } from '../types';

type TaskFlowNode = Node<{ label: string; department: string; status: string; reason?: string }, 'task'>;

const nodeStatusStyles: Record<string, string> = {
  Pending: 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900',
  'In Progress': 'border-sky-300 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-900/20',
  'Waiting Approval': 'border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-900/20',
  Completed: 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-900/20',
  Failed: 'border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-900/20',
  Cancelled: 'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
};

function TaskNode({ data }: { data: { label: string; department: string; status: string; reason?: string } }) {
  return (
    <div className={`w-60 rounded-xl border-2 p-3 shadow-sm ${nodeStatusStyles[data.status] ?? nodeStatusStyles.Pending}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{data.department}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{data.label}</div>
      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{data.status}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { task: TaskNode };

function buildGraph(tasks: Task[]) {
  const byTitle = new Map<string, Task>();
  tasks.forEach((task) => byTitle.set(task.title, task));

  const layerOf = new Map<string, number>();
  function layer(title: string): number {
    if (layerOf.has(title)) {
      return layerOf.get(title) as number;
    }
    const task = byTitle.get(title);
    const deps = (task?.dependencies ?? []).filter((dependency) => byTitle.has(dependency));
    const depth = deps.length ? 1 + Math.max(...deps.map(layer)) : 0;
    layerOf.set(title, depth);
    return depth;
  }
  tasks.forEach((task) => layer(task.title));

  const layers = new Map<number, Task[]>();
  tasks.forEach((task) => {
    const depth = layerOf.get(task.title) as number;
    const group = layers.get(depth) ?? [];
    group.push(task);
    layers.set(depth, group);
  });

  const nodes: TaskFlowNode[] = [];
  layers.forEach((group, depth) => {
    group.forEach((task, index) => {
      nodes.push({
        id: task._id,
        type: 'task',
        position: { x: depth * 320, y: index * 150 },
        data: { label: task.title, department: task.department, status: task.status, reason: task.reason }
      });
    });
  });

  const idByTitle = new Map<string, string>();
  tasks.forEach((task) => idByTitle.set(task.title, task._id));

  const edges: Edge[] = [];
  tasks.forEach((task) => {
    (task.dependencies ?? []).forEach((dependency) => {
      const source = idByTitle.get(dependency);
      if (source) {
        edges.push({ id: `${source}-${task._id}`, source, target: task._id, animated: true });
      }
    });
  });

  return { nodes, edges };
}

export function WorkflowsPage() {
  const queryClient = useQueryClient();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: employeesData } = useQuery({ queryKey: ['workflow-employees'], queryFn: getEmployees });
  const { data: workflowsData, isLoading } = useQuery({ queryKey: ['workflows'], queryFn: getWorkflows });
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['workflow-detail', selectedWorkflowId],
    queryFn: () => getWorkflow(selectedWorkflowId as string),
    enabled: Boolean(selectedWorkflowId)
  });

  const workflows: Workflow[] = workflowsData?.data?.workflows ?? [];
  const employees = employeesData?.data?.employees ?? [];
  const selectedWorkflow = workflows.find((workflow) => workflow._id === selectedWorkflowId) ?? workflows[0];
  const detail = detailData?.data;
  const tasks: Task[] = detail?.tasks ?? [];
  const approvals = detail?.approvals ?? [];

  useEffect(() => {
    if (employees.length && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0]._id);
    }
  }, [employees, selectedEmployeeId]);

  useEffect(() => {
    if (!selectedWorkflowId && workflows.length) {
      setSelectedWorkflowId(workflows[0]._id);
    }
  }, [workflows, selectedWorkflowId]);

  const { nodes, edges } = useMemo(() => buildGraph(tasks), [tasks]);

  async function handleCreateWorkflow() {
    if (!selectedEmployeeId) {
      toast.error('Select an employee first');
      return;
    }
    setCreating(true);
    try {
      await createWorkflow({ employeeId: selectedEmployeeId, title: 'AI-generated onboarding', priority: 'High' });
      await queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow created');
    } catch (error) {
      toast.error('Unable to create workflow');
    } finally {
      setCreating(false);
    }
  }

  const activeWorkflow = selectedWorkflowId ? selectedWorkflow : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-300">Workflow orchestration</p>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Generate onboarding flows</h2>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:w-64 dark:border-slate-700 dark:bg-slate-800/60"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              {employees.length === 0 && <option value="">No employees yet — upload an offer first</option>}
              {employees.map((employee: any) => <option key={employee._id} value={employee._id}>{employee.name} ({employee.role})</option>)}
            </select>
            <button
              onClick={handleCreateWorkflow}
              disabled={creating || employees.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" /> {creating ? 'Creating…' : 'Create workflow'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <h3 className="px-2 text-sm font-semibold text-slate-900 dark:text-white">Workflows</h3>
          {isLoading ? (
            <p className="px-2 py-6 text-sm text-slate-500 dark:text-slate-400">Loading workflows…</p>
          ) : workflows.length === 0 ? (
            <p className="px-2 py-6 text-sm text-slate-500 dark:text-slate-400">No workflows yet. Create one to see the dependency graph.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {workflows.map((workflow) => (
                <li key={workflow._id}>
                  <button
                    onClick={() => setSelectedWorkflowId(workflow._id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${workflow._id === activeWorkflow?._id ? 'border-brand-300 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{workflow.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{workflow.summary}</p>
                    <div className="mt-2"><StatusBadge status={workflow.status ?? 'Pending'} /></div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900">
            {activeWorkflow ? (
              <>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-600 dark:text-brand-300">Dependency graph</p>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{activeWorkflow.title}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={activeWorkflow.status ?? 'Pending'} />
                    {activeWorkflow.durationMinutes ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">{activeWorkflow.durationMinutes}m</span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{activeWorkflow.summary}</p>

                <div className="mt-4 h-[420px] rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                  {detailLoading ? (
                    <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading graph…</p>
                  ) : tasks.length === 0 ? (
                    <p className="p-6 text-sm text-slate-500 dark:text-slate-400">No tasks generated for this workflow.</p>
                  ) : (
                    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.4}>
                      <Background variant={BackgroundVariant.Dots} gap={16} />
                      <Controls />
                      <MiniMap pannable zoomable nodeColor="#6366f1" />
                    </ReactFlow>
                  )}
                </div>

                {approvals.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Approval gates</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {approvals.map((approval: any) => (
                        <span key={approval._id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs dark:border-slate-700 dark:bg-slate-800/60">
                          <GitBranch className="h-3 w-3 text-brand-500" />
                          {approval.resource}
                          <StatusBadge status={approval.status} />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                Select a workflow to visualize its onboarding plan.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
