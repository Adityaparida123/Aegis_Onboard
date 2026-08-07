import api from './client';
import type { PolicyItem } from '../types';

export async function getPolicies(): Promise<PolicyItem[]> {
  const response = await api.get('/policies');
  return response.data.data.policies as PolicyItem[];
}

export async function updatePolicy(policyId: string, patch: Partial<PolicyItem>): Promise<PolicyItem> {
  const response = await api.patch(`/policies/${policyId}`, patch);
  return response.data.data.policy as PolicyItem;
}
