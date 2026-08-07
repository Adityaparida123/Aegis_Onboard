import api from './client';
import type { Employee, Workflow, Task, ApprovalItem } from '../types';

export interface UploadResult {
  upload: { filePath?: string; originalName?: string; size?: number };
  profile: Employee;
  workflow: Workflow;
  plan?: { tasks: Task[]; approvals?: { resource: string; status: string }[] };
  approvals?: ApprovalItem[];
}

export async function uploadOffer(file: File, onProgress?: (percent: number) => void): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload-offer', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    }
  });
  return response.data.data as UploadResult;
}
