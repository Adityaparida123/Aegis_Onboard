import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('aegis-token'),
  isAuthenticated: Boolean(localStorage.getItem('aegis-token')),
  login: (user, token) => {
    localStorage.setItem('aegis-token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('aegis-token');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
