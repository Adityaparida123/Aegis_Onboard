const mongoose = require('mongoose');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');

const memorySessions = [];
const memoryMessages = [];

async function createChatSession(payload) {
  const session = { ...payload, lastMessageAt: new Date() };
  if (mongoose.connection.readyState === 1) {
    return ChatSession.create(session);
  }

  const record = {
    _id: `${Date.now()}-${memorySessions.length + 1}`,
    ...session,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memorySessions.push(record);
  return record;
}

async function findChatSessionById(id) {
  if (mongoose.connection.readyState === 1) {
    return ChatSession.findById(id).lean();
  }

  return memorySessions.find((session) => session._id.toString() === id.toString()) || null;
}

async function listChatSessionsByEmployee(employeeId, userId) {
  if (mongoose.connection.readyState === 1) {
    const query = userId ? { $or: [{ employeeId }, { userId }] } : { employeeId };
    return ChatSession.find(query).sort({ lastMessageAt: -1 }).lean();
  }

  return memorySessions
    .filter((session) => session.employeeId?.toString() === String(employeeId) || (userId && session.userId?.toString() === String(userId)))
    .sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
}

async function touchChatSession(id) {
  if (mongoose.connection.readyState === 1) {
    return ChatSession.findByIdAndUpdate(id, { lastMessageAt: new Date() }, { new: true }).lean();
  }

  const session = memorySessions.find((entry) => entry._id.toString() === id.toString());
  if (session) {
    session.lastMessageAt = new Date();
  }
  return session;
}

async function createChatMessage(payload) {
  const message = { ...payload, timestamp: payload.timestamp || new Date() };
  if (mongoose.connection.readyState === 1) {
    return ChatMessage.create(message);
  }

  const record = { _id: `${Date.now()}-${memoryMessages.length + 1}`, ...message };
  memoryMessages.push(record);
  return record;
}

async function listMessagesBySession(sessionId) {
  if (mongoose.connection.readyState === 1) {
    return ChatMessage.find({ sessionId }).sort({ timestamp: 1 }).lean();
  }

  return memoryMessages
    .filter((message) => message.sessionId?.toString() === sessionId.toString())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

async function listMessagesByEmployee(employeeId, userId, limit = 100) {
  if (mongoose.connection.readyState === 1) {
    const query = userId ? { $or: [{ employeeId }, { userId }] } : { employeeId };
    return ChatMessage.find(query).sort({ timestamp: -1 }).limit(limit).lean();
  }

  return memoryMessages
    .filter((message) => message.employeeId?.toString() === String(employeeId) || (userId && message.userId?.toString() === String(userId)))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

module.exports = {
  createChatSession,
  findChatSessionById,
  listChatSessionsByEmployee,
  touchChatSession,
  createChatMessage,
  listMessagesBySession,
  listMessagesByEmployee
};
