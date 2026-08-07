import api from './client';

export async function getEmployees() {
  const response = await api.get('/employees');
  return response.data;
}

export async function getEmployee(id: string) {
  const response = await api.get(`/employees/${id}`);
  return response.data;
}
