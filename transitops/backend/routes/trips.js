const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const FuelLog = require('../models/FuelLog');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const trips = await Trip.find(filter)
      .populate('vehicle', 'regNumber name type')
      .populate('driver', 'name licenseNumber')
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle')
      .populate('driver');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create trip (Draft)
router.post('/', async (req, res) => {
  try {
    const { vehicle: vehicleId, driver: driverId, cargoWeight } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (!['Available'].includes(vehicle.status))
      return res.status(400).json({ message: `Vehicle is currently '${vehicle.status}' — not available for dispatch` });

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    if (driver.status !== 'Available')
      return res.status(400).json({ message: `Driver is currently '${driver.status}' — not available` });
    if (new Date(driver.licenseExpiry) < new Date())
      return res.status(400).json({ message: 'Driver license has expired — cannot assign to trip' });

    if (cargoWeight > vehicle.maxLoadCapacity)
      return res.status(400).json({ message: `Cargo weight (${cargoWeight} kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity} kg)` });

    const trip = await Trip.create({ ...req.body, createdBy: req.user._id });
    await trip.populate(['vehicle', 'driver']);
    res.status(201).json(trip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Dispatch trip (Draft → Dispatched)
router.patch('/:id/dispatch', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('vehicle').populate('driver');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.status !== 'Draft') return res.status(400).json({ message: 'Only Draft trips can be dispatched' });

    // Re-validate
    const vehicle = trip.vehicle;
    const driver = trip.driver;
    if (vehicle.status !== 'Available')
      return res.status(400).json({ message: `Vehicle is '${vehicle.status}' — cannot dispatch` });
    if (driver.status !== 'Available')
      return res.status(400).json({ message: `Driver is '${driver.status}' — cannot dispatch` });
    if (new Date(driver.licenseExpiry) < new Date())
      return res.status(400).json({ message: 'Driver license expired' });

    trip.status = 'Dispatched';
    trip.startedAt = new Date();
    await trip.save();

    vehicle.status = 'On Trip';
    await vehicle.save();
    driver.status = 'On Trip';
    await driver.save();

    res.json(trip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Complete trip (Dispatched → Completed)
router.patch('/:id/complete', async (req, res) => {
  try {
    const { actualDistance, fuelConsumed, endOdometer, revenue } = req.body;
    const trip = await Trip.findById(req.params.id).populate('vehicle').populate('driver');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.status !== 'Dispatched') return res.status(400).json({ message: 'Only Dispatched trips can be completed' });

    trip.status = 'Completed';
    trip.completedAt = new Date();
    trip.actualDistance = actualDistance || trip.plannedDistance;
    trip.fuelConsumed = fuelConsumed || 0;
    trip.endOdometer = endOdometer || trip.vehicle.odometer;
    trip.revenue = revenue || 0;
    await trip.save();

    // Update vehicle odometer
    trip.vehicle.status = 'Available';
    if (endOdometer) trip.vehicle.odometer = endOdometer;
    await trip.vehicle.save();

    // Auto-create fuel log if fuel consumed provided
    if (fuelConsumed && fuelConsumed > 0) {
      await FuelLog.create({
        vehicle: trip.vehicle._id,
        trip: trip._id,
        liters: fuelConsumed,
        costPerLiter: req.body.fuelCostPerLiter || 0,
        date: new Date(),
        odometer: endOdometer || trip.vehicle.odometer,
        notes: `Auto-logged from trip ${trip.tripCode}`
      });
    }

    trip.driver.status = 'Available';
    await trip.driver.save();

    res.json(trip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Cancel trip
router.patch('/:id/cancel', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('vehicle').populate('driver');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (!['Draft', 'Dispatched'].includes(trip.status))
      return res.status(400).json({ message: 'Cannot cancel a completed trip' });

    const wasDispatched = trip.status === 'Dispatched';
    trip.status = 'Cancelled';
    await trip.save();

    if (wasDispatched) {
      trip.vehicle.status = 'Available';
      await trip.vehicle.save();
      trip.driver.status = 'Available';
      await trip.driver.save();
    }

    res.json(trip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
