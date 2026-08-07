const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', index: true },
  actor: { type: String, required: true },
  action: { type: String, required: true },
  reason: { type: String },
  input: { type: mongoose.Schema.Types.Mixed },
  output: { type: mongoose.Schema.Types.Mixed },
  result: { type: String },
  prevHash: { type: String, default: null },
  hash: { type: String, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: false });

module.exports = mongoose.model('AuditLog', auditLogSchema);
