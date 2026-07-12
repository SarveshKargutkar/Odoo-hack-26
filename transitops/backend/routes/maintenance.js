const express = require('express');
const router = express.Router();
const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.vehicleId) filter.vehicle = req.query.vehicleId;
    if (req.query.status) filter.status = req.query.status;
    const logs = await MaintenanceLog.find(filter)
      .populate('vehicle', 'regNumber name')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id).populate('vehicle');
    if (!log) return res.status(404).json({ message: 'Maintenance log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create maintenance → auto set vehicle to In Shop
router.post('/', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.body.vehicle);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicle.status === 'On Trip')
      return res.status(400).json({ message: 'Vehicle is currently On Trip — cannot add to maintenance' });
    if (vehicle.status === 'Retired')
      return res.status(400).json({ message: 'Vehicle is Retired' });

    const log = await MaintenanceLog.create({ ...req.body, createdBy: req.user._id });
    vehicle.status = 'In Shop';
    await vehicle.save();
    await log.populate('vehicle', 'regNumber name');
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Close maintenance → restore vehicle to Available
router.patch('/:id/close', async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id).populate('vehicle');
    if (!log) return res.status(404).json({ message: 'Log not found' });
    if (log.status === 'Closed') return res.status(400).json({ message: 'Already closed' });

    log.status = 'Closed';
    log.endDate = new Date();
    log.cost = req.body.cost || log.cost;
    await log.save();

    // Restore vehicle unless retired
    if (log.vehicle.status !== 'Retired') {
      log.vehicle.status = 'Available';
      await log.vehicle.save();
    }

    res.json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const log = await MaintenanceLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('vehicle', 'regNumber name');
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const log = await MaintenanceLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
