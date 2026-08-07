const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  role: { type: String, required: true },
  department: { type: String, required: true },
  location: { type: String, required: true },
  clearance: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  offerFileName: { type: String },
  status: { type: String, enum: ['Draft', 'Provisioning', 'Completed', 'Failed'], default: 'Draft', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
