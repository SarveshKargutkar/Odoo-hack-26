const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET all vehicles with optional filters
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.region) filter.region = new RegExp(req.query.region, 'i');
    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single vehicle
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create vehicle
router.post('/', async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Registration number already exists' });
    res.status(400).json({ message: err.message });
  }
});

// PUT update vehicle
router.put('/:id', async (req, res) => {
  try {
    // Prevent manual status change to On Trip — that's done via trips
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Registration number already exists' });
    res.status(400).json({ message: err.message });
  }
});

// DELETE vehicle (soft: mark as Retired)
router.delete('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { status: 'Retired' }, { new: true });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle retired', vehicle });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
