const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  department: { type: String, required: true },
  role: { type: String, required: true },
  location: { type: String, required: true },
  clearance: { type: String, required: true },
  software: [{ type: String }],
  hardware: [{ type: String }],
  permissions: [{ type: String }],
  approvalRequirements: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);
