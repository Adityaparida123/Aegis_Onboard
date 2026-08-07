import { create } from 'zustand';
import type { Workflow } from '../types';

interface WorkflowState {
  workflows: Workflow[];
  activeWorkflowId: string | null;
  setWorkflows: (workflows: Workflow[]) => void;
  setActiveWorkflowId: (id: string | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflows: [],
  activeWorkflowId: null,
  setWorkflows: (workflows) => set({ workflows }),
  setActiveWorkflowId: (id) => set({ activeWorkflowId: id })
}));
