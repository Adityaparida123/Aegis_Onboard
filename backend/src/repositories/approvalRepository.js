const mongoose = require('mongoose');
const Approval = require('../models/Approval');

const memoryApprovals = [];

async function createApproval(payload) {
  if (mongoose.connection.readyState === 1) {
    return Approval.create(payload);
  }

  const approval = {
    _id: `${Date.now()}-${memoryApprovals.length + 1}`,
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryApprovals.push(approval);
  return approval;
}

async function findApprovalById(id) {
  if (mongoose.connection.readyState === 1) {
    return Approval.findById(id).lean();
  }

  return memoryApprovals.find((approval) => approval._id.toString() === id.toString()) || null;
}

async function listApprovals() {
  if (mongoose.connection.readyState === 1) {
    return Approval.find({}).sort({ createdAt: -1 }).lean();
  }

  return [...memoryApprovals].reverse();
}

async function listApprovalsByWorkflow(workflowId) {
  if (mongoose.connection.readyState === 1) {
    return Approval.find({ workflowId }).lean();
  }

  return memoryApprovals.filter((approval) => approval.workflowId?.toString() === workflowId.toString());
}

async function updateApproval(id, payload) {
  if (mongoose.connection.readyState === 1) {
    return Approval.findByIdAndUpdate(id, payload, { new: true }).lean();
  }

  const approval = memoryApprovals.find((entry) => entry._id.toString() === id.toString());
  if (!approval) {
    return null;
  }

  Object.assign(approval, payload, { updatedAt: new Date() });
  return approval;
}

module.exports = { createApproval, findApprovalById, listApprovals, listApprovalsByWorkflow, updateApproval };
