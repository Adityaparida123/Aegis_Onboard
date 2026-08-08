const request = require('supertest');
const app = require('../app');
const { createEmployee, findEmployeeByUserId, findEmployeeByEmail, listEmployees } = require('../repositories/employeeRepository');
const { findUserById } = require('../repositories/userRepository');

describe('User -> Employee linking', () => {
  describe('registration', () => {
    it('auto-creates a linked employee when no profile exists', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: 'secret123',
        role: 'IT'
      });

      expect(res.status).toBe(201);
      expect(res.body.data.employeeId).toBeTruthy();

      const employee = await findEmployeeByUserId(String(res.body.data.user.id));
      expect(employee).toBeTruthy();
      expect(employee.email).toBe('priya@example.com');
      expect(employee.role).toBe('IT');
      expect(employee.status).toBe('Draft');

      const user = await findUserById(String(res.body.data.user.id));
      expect(String(user.employeeId)).toBe(String(employee._id));
    });

    it('links an existing employee by email without duplicating it', async () => {
      const existing = await createEmployee({
        name: 'Rahul Verma',
        email: 'rahul@example.com',
        role: 'Software Engineer',
        department: 'Engineering',
        location: 'US',
        clearance: 'Confidential',
        joiningDate: new Date('2026-08-02'),
        status: 'Provisioning'
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Rahul Verma',
        email: 'rahul@example.com',
        password: 'secret123',
        role: 'HR'
      });

      expect(res.status).toBe(201);
      expect(res.body.data.employeeId).toBe(String(existing._id));

      const matches = (await listEmployees()).filter((e) => e.email === 'rahul@example.com');
      expect(matches.length).toBe(1);

      const linked = await findEmployeeByUserId(String(res.body.data.user.id));
      expect(String(linked._id)).toBe(String(existing._id));

      const user = await findUserById(String(res.body.data.user.id));
      expect(String(user.employeeId)).toBe(String(existing._id));
    });
  });

  describe('login', () => {
    it('links the account to a matching employee on login', async () => {
      const existing = await createEmployee({
        name: 'Anita Desai',
        email: 'anita@example.com',
        role: 'HR Manager',
        department: 'HR',
        location: 'US',
        clearance: 'Confidential',
        joiningDate: new Date('2025-01-15'),
        status: 'Completed'
      });

      await request(app).post('/api/auth/register').send({
        name: 'Anita Desai',
        email: 'anita@example.com',
        password: 'secret123',
        role: 'HR'
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'anita@example.com',
        password: 'secret123'
      });

      expect(res.status).toBe(200);
      expect(res.body.data.employeeId).toBe(String(existing._id));

      const linked = await findEmployeeByEmail('anita@example.com');
      expect(String(linked._id)).toBe(String(existing._id));
    });
  });

  describe('identity resolution', () => {
    it('resolves the employee via userId even when the email has changed', async () => {
      const reg = await request(app).post('/api/auth/register').send({
        name: 'Karan Mehta',
        email: 'karan@example.com',
        password: 'secret123',
        role: 'Finance'
      });
      const userId = String(reg.body.data.user.id);

      const employee = await findEmployeeByUserId(userId);
      const updated = await require('../repositories/employeeRepository').updateEmployee(employee._id, {
        email: 'karan.mehta@example.com'
      });
      expect(updated.email).toBe('karan.mehta@example.com');

      const ctx = await request(app)
        .get('/api/employee/context')
        .set('Authorization', `Bearer ${reg.body.data.token}`);

      expect(ctx.status).toBe(200);
      expect(ctx.body.data.context.employee.email).toBe('karan.mehta@example.com');

      const resolved = await findEmployeeByUserId(userId);
      expect(String(resolved._id)).toBe(String(employee._id));
      expect(resolved.email).toBe('karan.mehta@example.com');
    });
  });
});
