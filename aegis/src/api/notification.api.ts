import api from './client';

export async function getNotifications() {
  const response = await api.get('/notifications');
  return response.data;
}
