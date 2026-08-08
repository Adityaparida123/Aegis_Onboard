import { create } from 'zustand';
import type { User } from '../types';

function isTokenActive(token: string | null): boolean {
  if (!token) return false;
  try {
    const base64Url = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!base64Url) return false;
    const payload = JSON.parse(atob(base64Url));
    const expMs = Number(payload.exp) * 1000;
    return Number.isFinite(expMs) && expMs > Date.now();
  } catch {
    return false;
  }
}

function getStoredToken(): string | null {
  const token = localStorage.getItem('aegis-token');
  if (!token) return null;
  if (isTokenActive(token)) return token;
  localStorage.removeItem('aegis-token');
  return null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getStoredToken(),
  isAuthenticated: Boolean(getStoredToken()),
  login: (user, token) => {
    localStorage.setItem('aegis-token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('aegis-token');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
