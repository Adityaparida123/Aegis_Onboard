import api from './client';

export async function sendChatMessage(payload: { message: string; sessionId?: string }) {
  const response = await api.post('/chat', payload);
  return response.data;
}

export async function getChatHistory() {
  const response = await api.get('/chat/history');
  return response.data;
}

export async function getRecentMessages() {
  const response = await api.get('/chat/recent');
  return response.data;
}

export async function createSupportRequest(payload: { category: string; subject: string; description: string }) {
  const response = await api.post('/support/request', payload);
  return response.data;
}

export async function getSupportRequests() {
  const response = await api.get('/support/request');
  return response.data;
}

export async function getSupportRequestById(id: string) {
  const response = await api.get(`/support/request/${id}`);
  return response.data;
}
