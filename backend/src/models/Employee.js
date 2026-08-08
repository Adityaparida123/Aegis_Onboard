const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  role: { type: String, required: true },
  department: { type: String, required: true },
  location: { type: String },
  clearance: { type: String },
  joiningDate: { type: Date },
  offerFileName: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  status: { type: String, enum: ['Draft', 'Provisioning', 'Completed', 'Failed'], default: 'Draft', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
