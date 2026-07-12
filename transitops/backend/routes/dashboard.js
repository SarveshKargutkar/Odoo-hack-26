const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/kpis', async (req, res) => {
  try {
    const [vehicles, drivers, trips] = await Promise.all([
      Vehicle.find({}),
      Driver.find({}),
      Trip.find({})
    ]);

    const totalVehicles = vehicles.length;
    const available = vehicles.filter(v => v.status === 'Available').length;
    const onTrip = vehicles.filter(v => v.status === 'On Trip').length;
    const inShop = vehicles.filter(v => v.status === 'In Shop').length;
    const retired = vehicles.filter(v => v.status === 'Retired').length;

    const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
    const pendingTrips = trips.filter(t => t.status === 'Draft').length;
    const driversOnDuty = drivers.filter(d => d.status === 'On Trip').length;

    const fleetUtilization = totalVehicles > 0
      ? parseFloat(((onTrip / totalVehicles) * 100).toFixed(1))
      : 0;

    const expiringLicenses = drivers.filter(d => {
      const expiry = new Date(d.licenseExpiry);
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      return expiry <= thirtyDays && expiry >= new Date();
    }).length;

    res.json({
      totalVehicles, available, onTrip, inShop, retired,
      activeTrips, pendingTrips, driversOnDuty,
      totalDrivers: drivers.length,
      fleetUtilization,
      expiringLicenses
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
