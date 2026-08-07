export function SettingsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-slate-900">Profile</h3>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="rounded-xl border border-slate-200 p-3">Primary role: HR Operations</div>
          <div className="rounded-xl border border-slate-200 p-3">Region: US-East</div>
          <div className="rounded-xl border border-slate-200 p-3">Security posture: MFA enabled</div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="rounded-xl border border-slate-200 p-3">Approval reminders: Enabled</div>
          <div className="rounded-xl border border-slate-200 p-3">Daily digest: Enabled</div>
          <div className="rounded-xl border border-slate-200 p-3">Audit alerts: Enabled</div>
        </div>
      </div>
    </div>
  );
}
