const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const { verifyAuditChain } = require('../repositories/auditRepository');

describe('MongoDB-backed persistence', () => {
  let mongo;
  let token;
  let workflowId;
  let employeeId;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 120_000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) {
      await mongo.stop();
    }
  }, 30_000);

  it('registers a user and stores the account in MongoDB', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'DB User', email: 'db@example.com', password: 'secret123', role: 'HR' });

    expect(reg.status).toBe(201);
    token = reg.body.data.token;

    const users = await mongoose.connection.collection('users').find({}).toArray();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe('db@example.com');
  });

  it('persists the workflow, tasks, and approvals collections', async () => {
    const response = await request(app)
      .post('/api/hris/webhook')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventType: 'employee.onboarded',
        name: 'Grace Persist',
        email: 'grace.persist@example.com',
        role: 'Software Engineer',
        department: 'Engineering',
        location: 'US',
        clearance: 'Confidential',
        joiningDate: '2026-09-01'
      });

    expect(response.status).toBe(201);
    workflowId = response.body.data.workflow._id;
    employeeId = response.body.data.employee._id;

    const [workflow] = await mongoose.connection.collection('workflows').find({}).toArray();
    expect(String(workflow._id)).toBe(String(workflowId));
    expect(workflow.status).toBe('Waiting Approval');

    const tasks = await mongoose.connection.collection('tasks').find({}).toArray();
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.some((task) => task.title === 'Provision IT access')).toBe(true);

    const approvals = await mongoose.connection.collection('approvals').find({}).toArray();
    expect(approvals.length).toBeGreaterThan(0);
  });

  it('approves all gates and completes the workflow', async () => {
    const approvalsResponse = await request(app).get('/api/approvals').set('Authorization', `Bearer ${token}`);
    const pending = approvalsResponse.body.data.approvals.filter(
      (approval) => String(approval.workflowId) === String(workflowId) && approval.status === 'Pending'
    );

    for (const approval of pending) {
      await request(app).post(`/api/approvals/${approval._id}/approve`).set('Authorization', `Bearer ${token}`);
    }

    const detail = await request(app).get(`/api/workflows/${workflowId}`).set('Authorization', `Bearer ${token}`);
    expect(detail.body.data.workflow.status).toBe('Completed');
    expect(detail.body.data.tasks.every((task) => task.status === 'Completed')).toBe(true);

    const employee = await mongoose.connection.collection('employees').findOne({ _id: mongoose.Types.ObjectId.createFromHexString(String(employeeId)) });
    expect(employee.status).toBe('Completed');
  });

  it('verifies the persisted audit chain', async () => {
    const integrity = await verifyAuditChain(workflowId);
    expect(integrity.valid).toBe(true);
    expect(integrity.count).toBeGreaterThan(0);

    const http = await request(app).get(`/api/audit/${workflowId}/verify`).set('Authorization', `Bearer ${token}`);
    expect(http.body.data.integrity.valid).toBe(true);
  });

  it('detects tampering inside MongoDB', async () => {
    const log = await mongoose.connection.collection('auditlogs').findOne({
      workflowId: mongoose.Types.ObjectId.createFromHexString(String(workflowId)),
      action: 'workflow_generated'
    });
    expect(log).toBeDefined();

    await mongoose.connection
      .collection('auditlogs')
      .updateOne({ _id: log._id }, { $set: { action: 'workflow_tampered' } });

    const integrity = await verifyAuditChain(workflowId);
    expect(integrity.valid).toBe(false);
  });
});
