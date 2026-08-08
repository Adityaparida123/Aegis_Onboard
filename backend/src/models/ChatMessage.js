const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  message: { type: String, required: true, trim: true },
  response: { type: String, required: true },
  intent: { type: String, default: 'general' },
  actionTaken: { type: String, default: 'none' },
  actionRequired: { type: Boolean, default: false },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportRequest' },
  escalation: {
    status: { type: String, enum: ['none', 'routed', 'pending'], default: 'none' },
    department: { type: String }
  },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: false });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
