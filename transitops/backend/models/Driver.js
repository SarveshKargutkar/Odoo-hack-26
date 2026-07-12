const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  licenseNumber: { type: String, required: true, unique: true, trim: true },
  licenseCategory: { type: String, enum: ['A', 'B', 'C', 'D', 'E'], required: true },
  licenseExpiry: { type: Date, required: true },
  contact: { type: String, required: true, trim: true },
  safetyScore: { type: Number, min: 0, max: 100, default: 100 },
  status: { type: String, enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'], default: 'Available' },
  notes: { type: String, default: '' }
}, { timestamps: true });

driverSchema.virtual('licenseExpired').get(function () {
  return new Date(this.licenseExpiry) < new Date();
});

driverSchema.set('toJSON', { virtuals: true });
driverSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Driver', driverSchema);
