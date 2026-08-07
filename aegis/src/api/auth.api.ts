import api from './client';

export async function loginUser(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

export async function registerUser(name: string, email: string, password: string, role: string) {
  const response = await api.post('/auth/register', { name, email, password, role });
  return response.data;
}
