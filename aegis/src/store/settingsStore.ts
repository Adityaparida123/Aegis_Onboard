import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '../types';

const STORAGE_KEY = 'aegis-settings';

export const DEFAULT_SETTINGS: AppSettings = {
  profile: {
    timezone: 'UTC',
    locale: 'en-US'
  },
  notifications: {
    enabled: true,
    approvalReminders: true,
    workflowUpdates: true,
    completionAlerts: true,
    dailyDigest: true,
    pollIntervalSeconds: 30
  },
  security: {
    mfaEnabled: true,
    sessionTimeoutMinutes: 120
  },
  automation: {
    aiAssisted: true,
    autoProvisionLowRisk: true
  },
  integrations: {
    email: true,
    slack: true,
    jira: true,
    github: true
  }
};

interface SettingsState {
  settings: AppSettings;
  setProfile: (profile: Partial<AppSettings['profile']>) => void;
  setNotifications: (patch: Partial<AppSettings['notifications']>) => void;
  setSecurity: (patch: Partial<AppSettings['security']>) => void;
  setAutomation: (patch: Partial<AppSettings['automation']>) => void;
  setIntegrations: (patch: Partial<AppSettings['integrations']>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      setProfile: (profile) => set((state) => ({ settings: { ...state.settings, profile: { ...state.settings.profile, ...profile } } })),
      setNotifications: (patch) => set((state) => ({ settings: { ...state.settings, notifications: { ...state.settings.notifications, ...patch } } })),
      setSecurity: (patch) => set((state) => ({ settings: { ...state.settings, security: { ...state.settings.security, ...patch } } })),
      setAutomation: (patch) => set((state) => ({ settings: { ...state.settings, automation: { ...state.settings.automation, ...patch } } })),
      setIntegrations: (patch) => set((state) => ({ settings: { ...state.settings, integrations: { ...state.settings.integrations, ...patch } } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS })
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      migrate: (persisted) => ({ ...DEFAULT_SETTINGS, ...(persisted as Partial<AppSettings>) })
    }
  )
);
