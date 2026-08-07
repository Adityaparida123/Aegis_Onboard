const request = require('supertest');
const app = require('../app');

describe('Aegis backend API', () => {
  let token;
  let workflowId;
  let approvalId;

  it('registers a user and returns a token', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'secret123', role: 'HR' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    token = response.body.data.token;
  });

  it('logs in the user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'secret123' });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });

  it('creates a workflow for an employee', async () => {
    const response = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: '123', title: 'New employee onboarding', priority: 'High' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    workflowId = response.body.data.workflow._id;
  });

  it('creates and resolves an approval request', async () => {
    const response = await request(app)
      .post(`/api/approvals/${workflowId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeId: '123', approvals: [{ resource: 'AWS Admin' }] });

    expect(response.status).toBe(201);
    approvalId = response.body.data.approvals[0]._id;

    const approveResponse = await request(app)
      .post(`/api/approvals/${approvalId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.data.approval.status).toBe('Approved');
  });

  it('returns audit history for a workflow', async () => {
    const response = await request(app)
      .get(`/api/audit/${workflowId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.history)).toBe(true);
  });

  it('uploads an offer and returns a workflow', async () => {
    const response = await request(app)
      .post('/api/upload-offer')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 test'), { filename: 'offer.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.workflow).toBeDefined();
  });
});
