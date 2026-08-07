const mongoose = require('mongoose');
const Task = require('../models/Task');

const memoryTasks = [];

async function createTask(payload) {
  if (mongoose.connection.readyState === 1) {
    return Task.create(payload);
  }

  const task = {
    _id: `${Date.now()}-${memoryTasks.length + 1}`,
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryTasks.push(task);
  return task;
}

async function listTasks() {
  if (mongoose.connection.readyState === 1) {
    return Task.find({}).lean();
  }

  return memoryTasks;
}

async function listTasksByWorkflow(workflowId) {
  if (mongoose.connection.readyState === 1) {
    return Task.find({ workflowId }).lean();
  }

  return memoryTasks.filter((task) => task.workflowId?.toString() === workflowId.toString());
}

async function updateTask(id, payload) {
  if (mongoose.connection.readyState === 1) {
    return Task.findByIdAndUpdate(id, payload, { new: true }).lean();
  }

  const task = memoryTasks.find((entry) => entry._id.toString() === id.toString());
  if (!task) {
    return null;
  }

  Object.assign(task, payload, { updatedAt: new Date() });
  return task;
}

module.exports = { createTask, listTasks, listTasksByWorkflow, updateTask };
