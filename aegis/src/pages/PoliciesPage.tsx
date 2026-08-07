import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Save, X, ShieldCheck } from 'lucide-react';
import { getPolicies, updatePolicy } from '../api/policy.api';
import { EmptyState } from '../components/EmptyState';
import type { PolicyItem } from '../types';

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function PolicyCard({ policy }: { policy: PolicyItem }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    clearance: policy.clearance,
    location: policy.location,
    software: policy.software.join(', '),
    hardware: policy.hardware.join(', '),
    permissions: policy.permissions.join(', '),
    approvalRequirements: policy.approvalRequirements.join(', ')
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      updatePolicy(policy._id, {
        clearance: form.clearance,
        location: form.location,
        software: parseList(form.software),
        hardware: parseList(form.hardware),
        permissions: parseList(form.permissions),
        approvalRequirements: parseList(form.approvalRequirements)
      }),
    onSuccess: () => {
      toast.success('Policy updated');
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
    onError: () => toast.error('Policy update failed')
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-500" />
          <div>
            <p className="font-semibold text-slate-900">{policy.role}</p>
            <p className="text-sm text-slate-500">{policy.department}</p>
          </div>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" />Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
              <Save className="h-3.5 w-3.5" />Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setForm({
                  clearance: policy.clearance,
                  location: policy.location,
                  software: policy.software.join(', '),
                  hardware: policy.hardware.join(', '),
                  permissions: policy.permissions.join(', '),
                  approvalRequirements: policy.approvalRequirements.join(', ')
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />Cancel
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Clearance</span>
              <input value={form.clearance} onChange={(event) => setForm({ ...form, clearance: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Location</span>
              <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-500" />
            </label>
          </div>
          {(['software', 'hardware', 'permissions', 'approvalRequirements'] as const).map((field) => (
            <label className="block" key={field}>
              <span className="mb-1 block text-xs font-medium text-slate-600 capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
              <textarea
                value={form[field]}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                rows={2}
                placeholder="Comma-separated values"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </label>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{policy.clearance}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{policy.location}</span>
          </div>
          <ChipRow label="Software" items={policy.software} />
          <ChipRow label="Hardware" items={policy.hardware} />
          <ChipRow label="Permissions" items={policy.permissions} />
          <ChipRow label="Approval requirements" items={policy.approvalRequirements} />
        </div>
      )}
    </div>
  );
}

export function PoliciesPage() {
  const { data: policies, isLoading } = useQuery({ queryKey: ['policies'], queryFn: getPolicies });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-medium text-brand-600">Policy guardrails</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">Governance policies</h2>
        <p className="mt-2 text-sm text-slate-500">
          Role-based access policies drive the coordinator&apos;s plan. Changes apply to newly generated workflows.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading policies…</p>
      ) : !policies || policies.length === 0 ? (
        <EmptyState title="No policies found" description="Policies will appear here once they are configured." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {policies.map((policy) => (
            <PolicyCard key={policy._id} policy={policy} />
          ))}
        </div>
      )}
    </div>
  );
}
