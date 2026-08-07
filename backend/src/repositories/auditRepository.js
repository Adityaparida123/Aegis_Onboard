const crypto = require('crypto');
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

const memoryAuditLogs = [];
const memoryChains = new Map();

function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(',')}}`;
}

function computeAuditHash(payload, prevHash) {
  return crypto.createHash('sha256').update(canonicalStringify({ ...payload, prevHash })).digest('hex');
}

async function getLastAuditHash(workflowId) {
  const key = String(workflowId);
  if (mongoose.connection.readyState === 1) {
    const last = await AuditLog.findOne({ workflowId }).sort({ createdAt: -1, _id: -1 }).lean();
    return last ? last.hash : null;
  }
  return memoryChains.get(key) || null;
}

async function createAuditLog(payload) {
  const prevHash = await getLastAuditHash(payload.workflowId);
  const hash = computeAuditHash(payload, prevHash);
  const record = { ...payload, prevHash, hash, createdAt: new Date() };

  if (mongoose.connection.readyState === 1) {
    return AuditLog.create(record);
  }

  const log = { _id: `${Date.now()}-${memoryAuditLogs.length + 1}`, ...record };
  memoryAuditLogs.push(log);
  memoryChains.set(String(payload.workflowId), hash);
  return log;
}

async function listAuditLogsByWorkflow(workflowId) {
  if (mongoose.connection.readyState === 1) {
    return AuditLog.find({ workflowId }).sort({ createdAt: 1, _id: 1 }).lean();
  }

  return memoryAuditLogs
    .filter((entry) => entry.workflowId?.toString() === workflowId.toString())
    .sort((a, b) => {
      const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return timeDiff !== 0 ? timeDiff : String(a._id).localeCompare(String(b._id));
    });
}

async function verifyAuditChain(workflowId) {
  const logs = await listAuditLogsByWorkflow(workflowId);
  let prevHash = null;

  for (const log of logs) {
    const payload = { ...log };
    delete payload._id;
    delete payload.__v;
    delete payload.createdAt;
    delete payload.prevHash;
    delete payload.hash;
    const expected = computeAuditHash(payload, prevHash);
    if (log.prevHash !== prevHash || log.hash !== expected) {
      return { valid: false, count: logs.length, failedAction: log.action };
    }
    prevHash = log.hash;
  }

  return { valid: true, count: logs.length };
}

module.exports = { createAuditLog, listAuditLogsByWorkflow, verifyAuditChain, _memoryAuditLogs: memoryAuditLogs };
