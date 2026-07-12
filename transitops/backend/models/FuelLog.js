const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
  liters: { type: Number, required: true, min: 0.1 },
  costPerLiter: { type: Number, required: true, min: 0 },
  totalCost: { type: Number },
  date: { type: Date, required: true, default: Date.now },
  odometer: { type: Number, required: true, min: 0 },
  stationName: { type: String, trim: true, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true });

fuelLogSchema.pre('save', function (next) {
  this.totalCost = parseFloat((this.liters * this.costPerLiter).toFixed(2));
  next();
});

module.exports = mongoose.model('FuelLog', fuelLogSchema);
