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

module.exports = { createUser, findUserByEmail, findUserById };
