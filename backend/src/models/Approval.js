const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', index: true },
  resource: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  requestedBy: { type: String },
  reason: { type: String },
  decision: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Approval', approvalSchema);
