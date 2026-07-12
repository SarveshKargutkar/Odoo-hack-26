const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripCode: { type: String, unique: true },
  source: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  cargoWeight: { type: Number, required: true, min: 0 }, // kg
  plannedDistance: { type: Number, required: true, min: 0 }, // km
  status: { type: String, enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'], default: 'Draft' },
  // Completion fields
  actualDistance: { type: Number, default: 0 },
  fuelConsumed: { type: Number, default: 0 }, // liters
  endOdometer: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  startedAt: { type: Date },
  completedAt: { type: Date },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-generate trip code
tripSchema.pre('save', async function (next) {
  if (!this.tripCode) {
    const count = await this.constructor.countDocuments();
    this.tripCode = `TRP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
