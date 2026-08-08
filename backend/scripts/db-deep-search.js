'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');
const { mongoUri } = require('../src/config/env');
function srvHostname(uri) { return new URL(uri.replace('mongodb+srv://', 'https://')).hostname; }
async function ensureSrvResolution() {
  if (!mongoUri.startsWith('mongodb+srv://')) return;
  const hostname = srvHostname(mongoUri);
  const tryResolve = (servers) => new Promise((resolve) => {
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
  const uid = new mongoose.Types.ObjectId('6a765f51a72568062929e048');
  const msgs = await db.collection('chatmessages')
    .find({ userId: uid })
    .sort({ createdAt: 1 })
    .project({ sessionId: 1, message: 1, response: 1, employeeId: 1, intent: 1, actionTaken: 1, createdAt: 1 })
    .toArray();
  console.log('CHAT MESSAGES for ADITYA PARIDA (chronological): ' + msgs.length);
  for (const m of msgs) {
    console.log(`\n[${m.createdAt}] intent=${m.intent} employeeId=${m.employeeId} actionTaken=${m.actionTaken}`);
    console.log(`  Q: ${m.message}`);
    console.log(`  A: ${(m.response || '').slice(0, 200)}`);
  }
  await mongoose.disconnect();
}
main().catch((e) => { console.error('FATAL:', e.message); process.exitCode = 1; });
