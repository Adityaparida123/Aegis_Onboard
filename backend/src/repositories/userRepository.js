const mongoose = require('mongoose');
const User = require('../models/User');

const memoryUsers = [];

async function createUser(payload) {
  if (mongoose.connection.readyState === 1) {
    return User.create(payload);
  }

  const user = {
    _id: `${Date.now()}-${memoryUsers.length + 1}`,
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryUsers.push(user);
  return user;
}

async function findUserByEmail(email) {
  if (mongoose.connection.readyState === 1) {
    return User.findOne({ email }).lean();
  }

  return memoryUsers.find((user) => user.email === email) || null;
}

async function findUserById(id) {
  if (mongoose.connection.readyState === 1) {
    return User.findById(id).lean();
  }

  return memoryUsers.find((user) => user._id.toString() === id.toString()) || null;
}

async function updateUser(id, payload) {
  if (mongoose.connection.readyState === 1) {
    return User.findByIdAndUpdate(id, payload, { new: true }).lean();
  }

  const user = memoryUsers.find((entry) => entry._id.toString() === String(id));
  if (!user) {
    return null;
  }
  Object.assign(user, payload, { updatedAt: new Date() });
  return user;
}

async function linkUserToEmployee(userId, employeeId) {
  if (mongoose.connection.readyState === 1) {
    await User.updateOne({ _id: userId, employeeId: { $exists: false } }, { $set: { employeeId } });
    await User.updateOne({ _id: userId, employeeId: null }, { $set: { employeeId } });
    return User.findById(userId).lean();
  }

  const user = memoryUsers.find((entry) => entry._id.toString() === String(userId));
  if (user && !user.employeeId) {
    user.employeeId = String(employeeId);
  }
  return user;
}

module.exports = { createUser, findUserByEmail, findUserById, updateUser, linkUserToEmployee };
