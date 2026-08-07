import api from './client';

export async function getApprovals() {
  const response = await api.get('/approvals');
  return response.data;
}

export async function requestApproval(workflowId: string, employeeId: string, resource: string) {
  const response = await api.post(`/approvals/${workflowId}`, { employeeId, approvals: [{ resource }] });
  return response.data;
}

export async function approveApproval(approvalId: string) {
  const response = await api.post(`/approvals/${approvalId}/approve`);
  return response.data;
}

export async function rejectApproval(approvalId: string) {
  const response = await api.post(`/approvals/${approvalId}/reject`);
  return response.data;
}
