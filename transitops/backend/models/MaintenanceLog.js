const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  type: {
    type: String,
    enum: ['Oil Change', 'Tire Replacement', 'Brake Service', 'Engine Repair', 'AC Service', 'Battery', 'General Inspection', 'Other'],
    required: true
  },
  description: { type: String, default: '' },
  cost: { type: Number, default: 0, min: 0 },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date },
  status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
  vendor: { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceLog', maintenanceSchema);
