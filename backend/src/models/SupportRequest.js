const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  category: { type: String, enum: ['HR', 'IT', 'Finance', 'Security'], required: true, index: true },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  source: { type: String, enum: ['chat', 'self-service'], default: 'chat' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved', 'Closed'], default: 'Pending', index: true },
  assignedDepartment: { type: String, default: 'HR' },
  createdByEmail: { type: String },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
