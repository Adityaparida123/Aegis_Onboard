'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');
const { mongoUri } = require('../src/config/env');

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
  console.log('[db-inspect] Default DNS refused SRV lookup; retrying via public resolvers.');
  await tryResolve(['8.8.8.8', '1.1.1.1']);
}

function mask(uri) {
  try {
    const u = new URL(uri);
    if (u.username || u.password) {
      u.username = '***';
      u.password = '***';
    }
    return u.toString();
  } catch {
    return String(uri).replace(/\/\/[^@/]+@/, '//***@');
  }
}

function stringifyId(v) {
  if (v === null || v === undefined) return String(v);
  return String(v);
}

async function main() {
  console.log(`TARGET: ${mask(mongoUri)}`);
  console.log(`TARGET_DB_IN_URI: "${mongoUri.split('?')[0].split('/').slice(-1)[0]}"`);
  await ensureSrvResolution();
  await mongoose.connect(mongoUri);
  console.log('CONNECTED: yes');

  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log('\n=== DATABASES ON CLUSTER ===');
  for (const dbInfo of dbs.databases) {
    console.log(`  ${dbInfo.name}  (${dbInfo.sizeOnDisk || 0} bytes)`);
  }

  const conn = mongoose.connection;
  for (const dbName of dbs.databases.map((d) => d.name).filter((n) => n !== 'admin' && n !== 'local')) {
    const db = conn.useDb(dbName, { noListener: true });
    console.log(`\n===== DB: ${dbName} =====`);
    const userCount = await db.collection('users').countDocuments().catch(() => '?');
    const empCount = await db.collection('employees').countDocuments().catch(() => '?');
    console.log(`  users=${userCount}  employees=${empCount}`);

    const users = await db.collection('users').find({}, { projection: { name: 1, email: 1, role: 1, department: 1, employeeId: 1, active: 1 } }).limit(50).toArray().catch(() => []);
    const employees = await db.collection('employees').find({}, { projection: { name: 1, email: 1, role: 1, department: 1, userId: 1, status: 1 } }).limit(50).toArray().catch(() => []);

    console.log('  --- USERS ---');
    for (const u of users) {
      console.log(`    id=${stringifyId(u._id)} email="${u.email}" role="${u.role}" name="${u.name}" employeeId=${stringifyId(u.employeeId)} active=${u.active}`);
    }
    console.log('  --- EMPLOYEES ---');
    for (const e of employees) {
      console.log(`    id=${stringifyId(e._id)} email="${e.email}" role="${e.role}" name="${e.name}" userId=${stringifyId(e.userId)} status="${e.status}"`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDISCONNECTED');
}

main().catch((error) => {
  console.error('FATAL:', error.message);
  process.exitCode = 1;
});
