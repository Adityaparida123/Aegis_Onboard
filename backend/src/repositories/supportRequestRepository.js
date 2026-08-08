const mongoose = require('mongoose');
const SupportRequest = require('../models/SupportRequest');

const memoryRequests = [];

async function createSupportRequest(payload) {
  if (mongoose.connection.readyState === 1) {
    return SupportRequest.create(payload);
  }

  const request = {
    _id: `${Date.now()}-${memoryRequests.length + 1}`,
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryRequests.push(request);
  return request;
}

async function findSupportRequestById(id) {
  if (mongoose.connection.readyState === 1) {
    return SupportRequest.findById(id).lean();
  }

  return memoryRequests.find((request) => request._id.toString() === id.toString()) || null;
}

async function listSupportRequestsByEmployee(employeeId, userId) {
  if (mongoose.connection.readyState === 1) {
    const query = userId ? { $or: [{ employeeId }, { userId }] } : { employeeId };
    return SupportRequest.find(query).sort({ createdAt: -1 }).lean();
  }

  return memoryRequests
    .filter((request) => request.employeeId?.toString() === String(employeeId) || (userId && request.userId?.toString() === String(userId)))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

async function listSupportRequests() {
  if (mongoose.connection.readyState === 1) {
    return SupportRequest.find({}).sort({ createdAt: -1 }).lean();
  }

  return [...memoryRequests].reverse();
}

module.exports = { createSupportRequest, findSupportRequestById, listSupportRequestsByEmployee, listSupportRequests };
