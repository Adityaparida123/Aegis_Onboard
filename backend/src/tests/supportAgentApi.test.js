const request = require('supertest');
const app = require('../app');
const { createEmployee } = require('../repositories/employeeRepository');
const { createWorkflow } = require('../repositories/workflowRepository');
const { createTask } = require('../repositories/taskRepository');
const { createApproval } = require('../repositories/approvalRepository');

describe('Employee support agent API', () => {
  let avaToken;
  let staffToken;
  let adminToken;
  let requestId;

  const originalKey = process.env.GEMINI_API_KEY;

  beforeAll(async () => {
    delete process.env.GEMINI_API_KEY;

    // Seed the employee profile BEFORE registration so register-time linking
    // associates the account with this full profile (instead of a minimal one).
    const employee = await createEmployee({
      name: 'Ava Sharma',
      email: 'ava@example.com',
      role: 'Software Engineer',
      department: 'Engineering',
      location: 'US',
      clearance: 'Confidential',
      joiningDate: new Date('2026-08-02'),
      status: 'Provisioning'
    });

    const workflow = await createWorkflow({
      employeeId: employee._id,
      title: 'Onboarding for Ava Sharma',
      status: 'Waiting Approval',
      priority: 'High'
    });
    await createTask({
      workflowId: workflow._id,
      title: 'Provision IT access',
      department: 'IT',
      assignedDepartment: 'IT',
      status: 'Completed',
      priority: 'High'
    });
    await createTask({
      workflowId: workflow._id,
      title: 'Request privileged access',
      department: 'Security',
      assignedDepartment: 'Security',
      status: 'Pending',
      priority: 'High'
    });
    await createApproval({
      workflowId: workflow._id,
      employeeId: employee._id,
      resource: 'GitHub Organization Admin',
      status: 'Pending',
      requestedBy: 'Security Manager'
    });

    const avaRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ava Sharma', email: 'ava@example.com', password: 'secret123', role: 'HR' });
    avaToken = avaRegister.body.data.token;

    const staffRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ivan Petrov', email: 'ivan@example.com', password: 'secret123', role: 'IT' });
    staffToken = staffRegister.body.data.token;

    const adminRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Root Admin', email: 'root@example.com', password: 'secret123', role: 'Admin' });
    adminToken = adminRegister.body.data.token;
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalKey;
  });

  it('rejects unauthenticated chat messages', async () => {
    const response = await request(app).post('/api/chat').send({ message: 'Hi' });
    expect(response.status).toBe(401);
  });

  it('answers an approval-status question from verified data', async () => {
    const response = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${avaToken}`)
      .send({ message: 'Is my GitHub access approved?' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.answer).toContain('GitHub Organization Admin');
    expect(response.body.data.answer).toContain('pending manager approval');
    expect(response.body.data.intent).toBe('approval_status');
    expect(response.body.data.actionRequired).toBe(false);
    expect(response.body.data.sessionId).toBeDefined();
  });

  it('creates a routed request instead of acting on sensitive requests', async () => {
    const response = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${avaToken}`)
      .send({ message: 'Please reset my password.' });

    expect(response.status).toBe(200);
    expect(response.body.data.actionRequired).toBe(true);
    expect(response.body.data.actionTaken).toBe('support_request_created');
    expect(response.body.data.escalation).toMatchObject({ status: 'routed', department: 'IT' });
    requestId = response.body.data.requestId;
  });

  it('returns chat history for the authenticated employee', async () => {
    const response = await request(app).get('/api/chat/history').set('Authorization', `Bearer ${avaToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.sessions)).toBe(true);
    expect(response.body.data.sessions.length).toBeGreaterThan(0);
    expect(response.body.data.sessions[0].messages.length).toBeGreaterThan(0);
  });

  it('returns the verified employee context', async () => {
    const response = await request(app).get('/api/employee/context').set('Authorization', `Bearer ${avaToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.context.employee.email).toBe('ava@example.com');
    expect(response.body.data.context.softwareEntitled).toContain('GitHub');
    expect(response.body.data.context.onboarding.length).toBeGreaterThan(0);
  });

  it('creates a self-service support request', async () => {
    const response = await request(app)
      .post('/api/support/request')
      .set('Authorization', `Bearer ${avaToken}`)
      .send({ category: 'Finance', subject: 'Missing payslip', description: 'I did not receive my latest payslip.' });

    expect(response.status).toBe(201);
    expect(response.body.data.request).toMatchObject({ category: 'Finance', status: 'Pending' });
  });

  it('lets the owner read their own support request', async () => {
    const response = await request(app).get(`/api/support/request/${requestId}`).set('Authorization', `Bearer ${avaToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.request._id.toString()).toBe(requestId);
  });

  it('blocks a non-owner staff member from reading a support request', async () => {
    const response = await request(app).get(`/api/support/request/${requestId}`).set('Authorization', `Bearer ${staffToken}`);
    expect(response.status).toBe(403);
  });

  it('allows an Admin to read any support request', async () => {
    const response = await request(app).get(`/api/support/request/${requestId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
  });

  it('lists only the authenticated employee requests', async () => {
    const response = await request(app).get('/api/support/request').set('Authorization', `Bearer ${avaToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.requests.length).toBe(2);
  });
});
