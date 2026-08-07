const request = require('supertest');
const app = require('../app');

describe('Policy management', () => {
  let token;

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Policy User', email: 'policy@example.com', password: 'secret123', role: 'Admin' });
    token = reg.body.data.token;
  });

  it('lists the role policies', async () => {
    const response = await request(app).get('/api/policies').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data.policies.length).toBeGreaterThanOrEqual(6);
  });

  it('updates a policy and the change propagates to new workflows', async () => {
    const list = await request(app).get('/api/policies').set('Authorization', `Bearer ${token}`);
    const accountant = list.body.data.policies.find((policy) => policy.role === 'Accountant');
    expect(accountant).toBeDefined();

    const patch = await request(app)
      .patch(`/api/policies/${accountant._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ approvalRequirements: [...(accountant.approvalRequirements || []), 'Treasury Console'] });

    expect(patch.status).toBe(200);
    expect(patch.body.data.policy.approvalRequirements).toContain('Treasury Console');

    const workflow = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: 'policy-emp', title: 'Accountant onboarding', priority: 'High', role: 'Accountant', department: 'Finance' });

    expect(workflow.status).toBe(201);
    const planApprovals = workflow.body.data.plan.approvals.map((approval) => approval.resource);
    expect(planApprovals).toContain('Treasury Console');
  });

  it('returns 404 when patching an unknown policy', async () => {
    const response = await request(app)
      .patch('/api/policies/nope')
      .set('Authorization', `Bearer ${token}`)
      .send({ clearance: 'Top Secret' });

    expect(response.status).toBe(404);
  });
});
