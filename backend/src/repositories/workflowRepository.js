const mongoose = require('mongoose');
const Workflow = require('../models/Workflow');

const memoryWorkflows = [];

async function createWorkflow(payload) {
  if (mongoose.connection.readyState === 1) {
    return Workflow.create(payload);
  }

  const workflow = {
    _id: `${Date.now()}-${memoryWorkflows.length + 1}`,
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryWorkflows.push(workflow);
  return workflow;
}

async function findWorkflowById(id) {
  if (mongoose.connection.readyState === 1) {
    return Workflow.findById(id).lean();
  }

  return memoryWorkflows.find((workflow) => workflow._id.toString() === id.toString()) || null;
}

async function listWorkflows() {
  if (mongoose.connection.readyState === 1) {
    return Workflow.find({}).sort({ createdAt: -1 }).lean();
  }

  return [...memoryWorkflows].reverse();
}

async function updateWorkflow(id, payload) {
  if (mongoose.connection.readyState === 1) {
    return Workflow.findByIdAndUpdate(id, payload, { new: true }).lean();
  }

  const workflow = memoryWorkflows.find((entry) => entry._id.toString() === id.toString());
  if (!workflow) {
    return null;
  }

  Object.assign(workflow, payload, { updatedAt: new Date() });
  return workflow;
}

module.exports = { createWorkflow, findWorkflowById, listWorkflows, updateWorkflow };
