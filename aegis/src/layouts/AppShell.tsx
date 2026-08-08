import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronRight, Menu, Search, Settings, ShieldCheck, Sparkles, UserCircle2, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { getNotifications } from '../api/notification.api';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/employees', label: 'Employees' },
  { to: '/onboarding', label: 'Onboarding' },
  { to: '/workflows', label: 'Workflows' },
  { to: '/approvals', label: 'Approvals' },
  { to: '/audit', label: 'Audit Logs' },
  { to: '/policies', label: 'Policies' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' }
];

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const notificationsSettings = useSettingsStore((state) => state.settings.notifications);

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: notificationsSettings.enabled,
    refetchInterval: notificationsSettings.pollIntervalSeconds * 1000
  });
  const rawNotifications = notificationsData?.data?.notifications ?? [];
  const notifications = rawNotifications.filter((notification: any) => {
    if (!notificationsSettings.enabled) return false;
    const type: string = notification.type ?? '';
    if (type === 'warning') return notificationsSettings.approvalReminders;
    if (type === 'success') return notificationsSettings.completionAlerts;
    return notificationsSettings.workflowUpdates;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-6 transition md:static md:translate-x-0`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-500 p-2 text-white"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <p className="text-lg font-semibold">Aegis Ops</p>
              <p className="text-sm text-slate-500">Onboarding Control Center</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4" />
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Sparkles className="h-4 w-4 text-brand-500" />
              AI Orchestration
            </div>
            <p className="mt-2 text-sm text-slate-600">Every onboarding action is logged for audit readiness and human oversight.</p>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button className="rounded-lg border border-slate-200 p-2 md:hidden" onClick={() => setSidebarOpen((v) => !v)}>
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <div className="hidden md:block">
                  <p className="text-sm text-slate-500">Enterprise onboarding</p>
                  <h1 className="text-xl font-semibold">Control plane</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
                  <Search className="h-4 w-4" />
                  <input className="bg-transparent outline-none" placeholder="Search workflows" />
                </label>
                <div className="relative">
                  <button className="relative rounded-xl border border-slate-200 p-2 text-slate-600" onClick={() => setNotificationsOpen((v) => !v)}>
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-medium text-white">{notifications.length}</span>
                    )}
                  </button>
                  {notificationsOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      <p className="px-3 py-2 text-sm font-semibold text-slate-900">Notifications</p>
                      {notifications.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-slate-500">No notifications yet.</p>
                      ) : (
                        <ul className="max-h-72 overflow-y-auto">
                          {notifications.map((notification: any) => (
                            <li key={notification._id} className="rounded-xl px-3 py-2 text-sm hover:bg-slate-50">
                              <p className="text-slate-800">{notification.message}</p>
                              <p className="mt-0.5 text-xs text-slate-400">{notification.type}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => { logout(); navigate('/login'); }}>
                  <UserCircle2 className="h-5 w-5" />
                  {user?.name ?? 'User'}
                </button>
              </div>
            </div>
          </header>

          <main className="p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
