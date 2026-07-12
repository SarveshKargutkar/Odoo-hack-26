const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const FuelLog = require('../models/FuelLog');
const MaintenanceLog = require('../models/MaintenanceLog');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/analytics/vehicles — per-vehicle breakdown
router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({});
    const result = await Promise.all(vehicles.map(async (v) => {
      const trips = await Trip.find({ vehicle: v._id, status: 'Completed' });
      const fuelLogs = await FuelLog.find({ vehicle: v._id });
      const maintenanceLogs = await MaintenanceLog.find({ vehicle: v._id });
      const expenses = await Expense.find({ vehicle: v._id });

      const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + f.liters, 0);
      const totalFuelCost = fuelLogs.reduce((sum, f) => sum + (f.totalCost || 0), 0);
      const totalMaintenanceCost = maintenanceLogs.reduce((sum, m) => sum + (m.cost || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalDistance = trips.reduce((sum, t) => sum + (t.actualDistance || 0), 0);
      const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);

      const operationalCost = totalFuelCost + totalMaintenanceCost + totalExpenses;
      const fuelEfficiency = totalFuelLiters > 0
        ? parseFloat((totalDistance / totalFuelLiters).toFixed(2))
        : 0;
      const roi = v.acquisitionCost > 0
        ? parseFloat(((totalRevenue - (totalMaintenanceCost + totalFuelCost)) / v.acquisitionCost * 100).toFixed(2))
        : 0;

      return {
        vehicleId: v._id,
        regNumber: v.regNumber,
        name: v.name,
        type: v.type,
        status: v.status,
        acquisitionCost: v.acquisitionCost,
        totalTrips: trips.length,
        totalDistance,
        totalFuelLiters: parseFloat(totalFuelLiters.toFixed(2)),
        totalFuelCost: parseFloat(totalFuelCost.toFixed(2)),
        totalMaintenanceCost: parseFloat(totalMaintenanceCost.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        operationalCost: parseFloat(operationalCost.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        fuelEfficiency,
        roi
      };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/summary
router.get('/summary', async (req, res) => {
  try {
    const [fuelLogs, maintenanceLogs, expenses, trips] = await Promise.all([
      FuelLog.find({}),
      MaintenanceLog.find({}),
      Expense.find({}),
      Trip.find({ status: 'Completed' })
    ]);

    const totalFuelCost = fuelLogs.reduce((s, f) => s + (f.totalCost || 0), 0);
    const totalMaintenanceCost = maintenanceLogs.reduce((s, m) => s + (m.cost || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalRevenue = trips.reduce((s, t) => s + (t.revenue || 0), 0);
    const totalDistance = trips.reduce((s, t) => s + (t.actualDistance || 0), 0);
    const totalFuelLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);

    res.json({
      totalFuelCost: parseFloat(totalFuelCost.toFixed(2)),
      totalMaintenanceCost: parseFloat(totalMaintenanceCost.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      totalOperationalCost: parseFloat((totalFuelCost + totalMaintenanceCost + totalExpenses).toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      totalFuelLiters: parseFloat(totalFuelLiters.toFixed(2)),
      avgFuelEfficiency: totalFuelLiters > 0 ? parseFloat((totalDistance / totalFuelLiters).toFixed(2)) : 0,
      completedTrips: trips.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
