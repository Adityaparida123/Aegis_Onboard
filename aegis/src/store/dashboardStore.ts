import { create } from 'zustand';
import type { DashboardStats } from '../types';

interface DashboardState {
  stats: DashboardStats | null;
  setStats: (stats: DashboardStats) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  setStats: (stats) => set({ stats })
}));
