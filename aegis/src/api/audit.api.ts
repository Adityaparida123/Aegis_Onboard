import api from './client';

export async function getAuditHistory(workflowId: string) {
  const response = await api.get(`/audit/${workflowId}`);
  return response.data;
}
