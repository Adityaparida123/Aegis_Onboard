import api from './client';

export async function getDashboardStats() {
  const response = await api.get('/dashboard');
  return response.data;
}
