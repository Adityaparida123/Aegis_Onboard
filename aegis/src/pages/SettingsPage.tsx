import { useState } from 'react';
import { toast } from 'sonner';
import {
  Bell,
  Bot,
  CheckCircle2,
  Clock,
  Globe,
  Languages,
  Link2,
  Lock,
  Mail,
  RotateCcw,
  Save,
  ShieldCheck,
  UserCircle2,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore, DEFAULT_SETTINGS } from '../store/settingsStore';

const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney'];
const LOCALES = ['en-US', 'en-GB', 'en-IN', 'de-DE', 'fr-FR', 'ja-JP'];
const SESSION_TIMEOUTS = [15, 30, 60, 120, 240, 480];
const POLL_INTERVALS = [15, 30, 60, 120];

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function SelectField({ label, value, options, onChange }: { label: React.ReactNode; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <select
        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Section({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const { user } = useAuthStore();
  const { settings, setProfile, setNotifications, setSecurity, setAutomation, setIntegrations, resetSettings } = useSettingsStore();
  const [isSaving, setIsSaving] = useState(false);

  const { profile, notifications, security, automation, integrations } = settings;

  function handleSave() {
    setIsSaving(true);
    window.setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings saved');
    }, 400);
  }

  function handleReset() {
    resetSettings();
    toast.success('Settings restored to defaults');
  }

  const initials = (user?.name ?? 'Demo User').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-sm font-medium text-brand-600 dark:text-brand-300">Workspace configuration</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Preferences are stored on this device and apply immediately to your control plane.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" /> Reset defaults
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4" /> {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section icon={<UserCircle2 className="h-5 w-5" />} title="Profile" description="Your identity and display preferences">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{initials}</div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{user?.name ?? 'Demo User'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email ?? 'demo@aegis.demo'}</p>
              <p className="mt-0.5 text-xs font-medium text-brand-600 dark:text-brand-300">{user?.role ?? 'HR'}</p>
            </div>
          </div>
          <SelectField label={<span className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> Timezone</span>} value={profile.timezone} options={TIMEZONES} onChange={(timezone) => setProfile({ timezone })} />
          <SelectField label={<span className="flex items-center gap-1.5"><Languages className="h-4 w-4" /> Locale</span>} value={profile.locale} options={LOCALES} onChange={(locale) => setProfile({ locale })} />
        </Section>

        <Section icon={<ShieldCheck className="h-5 w-5" />} title="Security" description="Session and authentication posture">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Two-factor authentication</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Require an additional verification code at sign-in.</p>
            </div>
            <Toggle checked={security.mfaEnabled} onChange={() => setSecurity({ mfaEnabled: !security.mfaEnabled })} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Session timeout</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Automatically sign out after a period of inactivity.</p>
            </div>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              value={security.sessionTimeoutMinutes}
              onChange={(event) => setSecurity({ sessionTimeoutMinutes: Number(event.target.value) })}
            >
              {SESSION_TIMEOUTS.map((minutes) => <option key={minutes} value={minutes}>{minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}</option>)}
            </select>
          </div>
        </Section>

        <Section icon={<Bell className="h-5 w-5" />} title="Notifications" description="Choose which alerts reach the notification bell">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notifications</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Master switch for all alerts.</p>
            </div>
            <Toggle checked={notifications.enabled} onChange={() => setNotifications({ enabled: !notifications.enabled })} />
          </div>
          {[
            { key: 'approvalReminders' as const, label: 'Approval reminders', hint: 'Pending and resolved security approvals.' },
            { key: 'workflowUpdates' as const, label: 'Workflow updates', hint: 'Onboarding progress and task changes.' },
            { key: 'completionAlerts' as const, label: 'Completion alerts', hint: 'Provisioning completed or failed.' },
            { key: 'dailyDigest' as const, label: 'Daily digest', hint: 'A summary of the day\u2019s activity.' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.hint}</p>
              </div>
              <Toggle checked={notifications[item.key]} disabled={!notifications.enabled} onChange={() => setNotifications({ [item.key]: !notifications[item.key] })} />
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Polling interval</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">How often the shell refreshes notifications.</p>
            </div>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              value={notifications.pollIntervalSeconds}
              onChange={(event) => setNotifications({ pollIntervalSeconds: Number(event.target.value) })}
            >
              {POLL_INTERVALS.map((seconds) => <option key={seconds} value={seconds}>{seconds}s</option>)}
            </select>
          </div>
        </Section>

        <Section icon={<Bot className="h-5 w-5" />} title="Automation" description="Orchestration and provisioning behavior">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">AI-assisted planning</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Use the coordinator agent to plan and route onboarding workflows.</p>
            </div>
            <Toggle checked={automation.aiAssisted} onChange={() => setAutomation({ aiAssisted: !automation.aiAssisted })} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto-provision low-risk access</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Provision standard resources without waiting for approval.</p>
            </div>
            <Toggle checked={automation.autoProvisionLowRisk} onChange={() => setAutomation({ autoProvisionLowRisk: !automation.autoProvisionLowRisk })} />
          </div>
        </Section>

        <Section icon={<Link2 className="h-5 w-5" />} title="Integrations" description="Connected systems used during provisioning">
          {([
            { key: 'email' as const, label: 'Email', hint: 'Notification and digest delivery', icon: Mail },
            { key: 'slack' as const, label: 'Slack', hint: 'Team alerting and approvals', icon: Zap },
            { key: 'jira' as const, label: 'Jira', hint: 'Task and ticket synchronization', icon: CheckCircle2 },
            { key: 'github' as const, label: 'GitHub', hint: 'Code and organization access', icon: Lock }
          ]).map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-400"><item.icon className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.hint}</p>
                </div>
              </div>
              <Toggle checked={integrations[item.key]} onChange={() => setIntegrations({ [item.key]: !integrations[item.key] })} />
            </div>
          ))}
        </Section>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-soft">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2.5"><Clock className="h-5 w-5" /></div>
            <div>
              <h3 className="text-lg font-semibold">Configuration summary</h3>
              <p className="text-sm text-slate-300">Current workspace posture at a glance.</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-300 dark:text-slate-400">Notifications</dt><dd className="font-medium">{notifications.enabled ? 'On' : 'Off'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300 dark:text-slate-400">MFA</dt><dd className="font-medium">{security.mfaEnabled ? 'Enabled' : 'Disabled'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300 dark:text-slate-400">Session timeout</dt><dd className="font-medium">{security.sessionTimeoutMinutes >= 60 ? `${security.sessionTimeoutMinutes / 60}h` : `${security.sessionTimeoutMinutes}m`}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300 dark:text-slate-400">AI planning</dt><dd className="font-medium">{automation.aiAssisted ? 'Active' : 'Manual'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300 dark:text-slate-400">Low-risk auto-provision</dt><dd className="font-medium">{automation.autoProvisionLowRisk ? 'On' : 'Off'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-300 dark:text-slate-400">Integrations</dt><dd className="font-medium">{Object.values(integrations).filter(Boolean).length} / {Object.keys(integrations).length} connected</dd></div>
          </dl>
          <div className="mt-5 rounded-xl bg-white/10 p-3 text-xs text-slate-300">
            Defaults are applied on first visit. Use <span className="font-medium text-white">Reset defaults</span> to restore the recommended posture.
          </div>
        </div>
      </div>
    </div>
  );
}
