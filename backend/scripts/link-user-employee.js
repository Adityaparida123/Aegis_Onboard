'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');
const { mongoUri } = require('../src/config/env');

const USER_EMAIL = 'adityaparidaomm@gmail.com';
const EMPLOYEE_EMAIL = 'diego.alvarez@aegis.demo';

function srvHostname(uri) {
  return new URL(uri.replace('mongodb+srv://', 'https://')).hostname;
}

async function ensureSrvResolution() {
  if (!mongoUri.startsWith('mongodb+srv://')) return;
  const hostname = srvHostname(mongoUri);
  const tryResolve = (servers) =>
    new Promise((resolve) => {
      if (servers) dns.setServers(servers);
      dns.resolveSrv(`_mongodb._tcp.${hostname}`, (error) => resolve(!error));
    });
  if (await tryResolve(null)) return;
  await tryResolve(['8.8.8.8', '1.1.1.1']);
}

async function main() {
  await ensureSrvResolution();
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const user = await db.collection('users').findOne({ email: USER_EMAIL });
  const employee = await db.collection('employees').findOne({ email: EMPLOYEE_EMAIL });

  if (!user) throw new Error(`User not found for email ${USER_EMAIL}`);
  if (!employee) throw new Error(`Employee not found for email ${EMPLOYEE_EMAIL}`);

  const beforeUserEmployeeId = user.employeeId ? String(user.employeeId) : 'undefined';
  const beforeEmployeeUserId = employee.userId ? String(employee.userId) : 'undefined';

  await db.collection('employees').updateOne({ _id: employee._id }, { $set: { userId: user._id } });
  await db.collection('users').updateOne({ _id: user._id }, { $set: { employeeId: employee._id } });

  console.log('USER        :', String(user._id), user.email, user.name, user.role);
  console.log('EMPLOYEE    :', String(employee._id), employee.email, employee.name, employee.role, employee.status);
  console.log('BEFORE      : user.employeeId=' + beforeUserEmployeeId, 'employee.userId=' + beforeEmployeeUserId);
  console.log('AFTER       : user.employeeId=' + String(employee._id), 'employee.userId=' + String(user._id));

  const workflows = await db
    .collection('workflows')
    .find({ employeeId: employee._id })
    .project({ title: 1, status: 1, priority: 1 })
    .toArray();
  console.log(`WORKFLOWS for linked employee (${workflows.length}):`);
  for (const w of workflows) {
    const tasks = await db.collection('tasks').countDocuments({ workflowId: w._id });
    const approvals = await db.collection('approvals').countDocuments({ workflowId: w._id });
    console.log(`  [${w.status}] ${w.title} (tasks=${tasks}, approvals=${approvals})`);
  }

  const pendingApprovals = await db
    .collection('approvals')
    .find({ workflowId: { $in: workflows.map((w) => w._id) }, status: 'Pending' })
    .project({ resource: 1, status: 1 })
    .toArray();
  console.log('PENDING APPROVALS:');
  for (const a of pendingApprovals) console.log(`  ${a.resource} (${a.status})`);

  await mongoose.disconnect();
  console.log('DONE');
}

main().catch((error) => {
  console.error('FATAL:', error.message);
  process.exitCode = 1;
});
