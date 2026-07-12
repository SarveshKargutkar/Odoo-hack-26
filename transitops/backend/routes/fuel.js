const express = require('express');
const router = express.Router();
const FuelLog = require('../models/FuelLog');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.vehicleId) filter.vehicle = req.query.vehicleId;
    const logs = await FuelLog.find(filter)
      .populate('vehicle', 'regNumber name')
      .populate('trip', 'tripCode')
      .sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const log = await FuelLog.create(req.body);
    await log.populate('vehicle', 'regNumber name');
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const log = await FuelLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!log) return res.status(404).json({ message: 'Fuel log not found' });
    res.json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await FuelLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
