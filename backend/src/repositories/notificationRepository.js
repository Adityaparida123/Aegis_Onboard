const mongoose = require('mongoose');
const Notification = require('../models/Notification');

const memoryNotifications = [];

async function createNotification(payload) {
  if (mongoose.connection.readyState === 1) {
    return Notification.create(payload);
  }

  const notification = {
    _id: `${Date.now()}-${memoryNotifications.length + 1}`,
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryNotifications.push(notification);
  return notification;
}

async function listNotifications(recipient) {
  if (mongoose.connection.readyState === 1) {
    return Notification.find({ recipient }).sort({ createdAt: -1 }).lean();
  }

  return memoryNotifications.filter((notification) => notification.recipient === recipient).reverse();
}

module.exports = { createNotification, listNotifications };
