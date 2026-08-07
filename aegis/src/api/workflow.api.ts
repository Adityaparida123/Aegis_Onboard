import api from './client';

export async function createWorkflow(payload: { employeeId: string; title: string; priority?: string }) {
  const response = await api.post('/workflows', payload);
  return response.data;
}

export async function getWorkflows() {
  const response = await api.get('/workflows');
  return response.data;
}

export async function getWorkflow(id: string) {
  const response = await api.get(`/workflows/${id}`);
  return response.data;
}
