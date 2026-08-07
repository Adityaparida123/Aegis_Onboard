const request = require('supertest');
const app = require('../app');
const { _memoryAuditLogs } = require('../repositories/auditRepository');

describe('Aegis HRIS webhook and audit integrity', () => {
  let token;

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Hris User', email: 'hris@example.com', password: 'secret123', role: 'HR' });
    token = reg.body.data.token;
  });

  it('ingests an HRIS webhook and generates a role-aware workflow', async () => {
    const response = await request(app)
      .post('/api/hris/webhook')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventType: 'employee.onboarded',
        name: 'Alan Kay',
        email: 'alan.kay@example.com',
        role: 'Accountant',
        department: 'Finance',
        location: 'Remote',
        clearance: 'Confidential'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.acknowledged).toBe(true);
    expect(response.body.data.workflow.status).toBe('Waiting Approval');
    expect(response.body.data.workflow.title).toContain('Alan Kay');
    const tasks = response.body.data.plan.tasks.map((task) => task.title);
    expect(tasks).toContain('Provision IT access');
    expect(tasks).toContain('Configure finance access');
    expect(tasks).toContain('Request privileged access');
    expect(response.body.data.approvals.length).toBeGreaterThan(0);
  });

  it('rejects an invalid HRIS payload', async () => {
    const response = await request(app)
      .post('/api/hris/webhook')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'employee.onboarded', name: 'No Email' });

    expect(response.status).toBe(400);
  });

  it('verifies the audit chain for a workflow', async () => {
    const response = await request(app)
      .post('/api/hris/webhook')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Grace Chain',
        email: 'grace.chain@example.com',
        role: 'Software Engineer',
        department: 'Engineering'
      });

    const workflowId = response.body.data.workflow._id;

    const verify = await request(app)
      .get(`/api/audit/${workflowId}/verify`)
      .set('Authorization', `Bearer ${token}`);

    expect(verify.status).toBe(200);
    expect(verify.body.data.integrity.valid).toBe(true);
    expect(verify.body.data.integrity.count).toBeGreaterThan(0);
  });

  it('detects a tampered audit log', async () => {
    const response = await request(app)
      .post('/api/hris/webhook')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Tanya Tamper',
        email: 'tanya.tamper@example.com',
        role: 'HR Manager',
        department: 'HR'
      });

    const workflowId = response.body.data.workflow._id;

    const target = _memoryAuditLogs.find(
      (entry) => entry.workflowId?.toString() === workflowId.toString() && entry.action === 'workflow_generated'
    );
    expect(target).toBeDefined();
    target.action = 'workflow_tampered';

    const verify = await request(app)
      .get(`/api/audit/${workflowId}/verify`)
      .set('Authorization', `Bearer ${token}`);

    expect(verify.status).toBe(200);
    expect(verify.body.data.integrity.valid).toBe(false);
  });
});
