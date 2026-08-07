const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
  title: { type: String, required: true },
  department: { type: String, required: true },
  assignedDepartment: { type: String, required: true },
  dependencies: [{ type: String }],
  status: { type: String, enum: ['Pending', 'In Progress', 'Waiting Approval', 'Completed', 'Failed', 'Cancelled'], default: 'Pending', index: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  estimatedDuration: { type: Number, default: 30 },
  reason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
