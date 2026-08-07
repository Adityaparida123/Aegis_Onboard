const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', index: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Waiting Approval', 'Completed', 'Failed', 'Cancelled'], default: 'Pending', index: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  summary: { type: String },
  completedAt: { type: Date },
  startedAt: { type: Date },
  durationMinutes: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Workflow', workflowSchema);
