const request = require('supertest');
const app = require('../app');

describe('Aegis onboarding lifecycle', () => {
  let token;
  let workflowId;
  let employeeId;

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Lifecycle', email: 'lifecycle@example.com', password: 'secret123', role: 'HR' });
    token = reg.body.data.token;
  });

  it('generates a workflow with auto-created approvals in Waiting Approval state', async () => {
    const response = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId: 'lifecycle-emp',
        title: 'Senior engineer onboarding',
        priority: 'High',
        name: 'Grace Hopper',
        role: 'Software Engineer',
        department: 'Engineering'
      });

    expect(response.status).toBe(201);
    workflowId = response.body.data.workflow._id;
    employeeId = response.body.data.employee._id;

    expect(response.body.data.workflow.status).toBe('Waiting Approval');
    expect(response.body.data.approvals.length).toBeGreaterThan(0);
    expect(response.body.data.plan.tasks.some((task) => task.title === 'Provision IT access')).toBe(true);
    expect(response.body.data.plan.tasks.some((task) => task.title === 'Request privileged access')).toBe(true);
  });

  it('lists workflows and includes tasks/approvals in the detail view', async () => {
    const list = await request(app).get('/api/workflows').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.workflows.length).toBeGreaterThan(0);

    const detail = await request(app).get(`/api/workflows/${workflowId}`).set('Authorization', `Bearer ${token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.tasks.length).toBeGreaterThan(0);
    expect(detail.body.data.approvals.length).toBeGreaterThan(0);
  });

  it('approves all auto-created approvals and finalizes the workflow', async () => {
    const approvalsResponse = await request(app).get('/api/approvals').set('Authorization', `Bearer ${token}`);
    const pending = approvalsResponse.body.data.approvals.filter(
      (approval) => approval.workflowId === workflowId && approval.status === 'Pending'
    );

    expect(pending.length).toBeGreaterThan(0);

    for (const approval of pending) {
      const response = await request(app).post(`/api/approvals/${approval._id}/approve`).set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
    }

    const detail = await request(app).get(`/api/workflows/${workflowId}`).set('Authorization', `Bearer ${token}`);
    expect(detail.body.data.workflow.status).toBe('Completed');
    expect(detail.body.data.workflow.durationMinutes).toBeGreaterThan(0);
    expect(detail.body.data.tasks.every((task) => task.status === 'Completed')).toBe(true);

    const audit = await request(app).get(`/api/audit/${workflowId}`).set('Authorization', `Bearer ${token}`);
    const actions = audit.body.data.history.map((entry) => entry.action);
    expect(actions).toContain('provision_resources');
    expect(actions).toContain('workflow_completed');

    const employees = await request(app).get('/api/employees').set('Authorization', `Bearer ${token}`);
    const employee = employees.body.data.employees.find((entry) => entry._id === employeeId);
    expect(employee.status).toBe('Completed');
  });

  it('rejects an approval and marks the workflow failed', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Reject User', email: 'reject@example.com', password: 'secret123', role: 'HR' });
    const rejectToken = reg.body.data.token;

    const wf = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${rejectToken}`)
      .send({ employeeId: 'reject-emp', title: 'Rejected onboarding', priority: 'High' });

    const id = wf.body.data.workflow._id;
    const approvalId = wf.body.data.approvals[0]._id;

    const response = await request(app).post(`/api/approvals/${approvalId}/reject`).set('Authorization', `Bearer ${rejectToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.approval.status).toBe('Rejected');

    const detail = await request(app).get(`/api/workflows/${id}`).set('Authorization', `Bearer ${rejectToken}`);
    expect(detail.body.data.workflow.status).toBe('Failed');
  });

  it('lists notifications for the actor', async () => {
    const response = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.notifications)).toBe(true);
    expect(response.body.data.notifications.length).toBeGreaterThan(0);
  });
});
