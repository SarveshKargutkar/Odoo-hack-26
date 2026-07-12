const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  regNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Truck', 'Van', 'Mini Truck', 'Bike', 'Tanker', 'Trailer'], required: true },
  maxLoadCapacity: { type: Number, required: true, min: 0 }, // kg
  odometer: { type: Number, default: 0 }, // km
  acquisitionCost: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Available', 'On Trip', 'In Shop', 'Retired'], default: 'Available' },
  region: { type: String, trim: true, default: '' },
  notes: { type: String, default: '' },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
