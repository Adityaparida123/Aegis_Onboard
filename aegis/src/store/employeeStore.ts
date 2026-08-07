import { create } from 'zustand';
import type { Employee } from '../types';

interface EmployeeState {
  employees: Employee[];
  selectedEmployeeId: string | null;
  setEmployees: (employees: Employee[]) => void;
  setSelectedEmployeeId: (id: string | null) => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: [],
  selectedEmployeeId: null,
  setEmployees: (employees) => set({ employees }),
  setSelectedEmployeeId: (id) => set({ selectedEmployeeId: id })
}));
