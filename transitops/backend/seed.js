require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');

const seed = async () => {
  console.log('\n🌱 Starting seed...\n');

  await connectDB();
  console.log('✔ Connected to MongoDB');

  // ── Clear existing data ─────────────────────────────────────────────────────
  await User.deleteMany({});
  await Vehicle.deleteMany({});
  await Driver.deleteMany({});
  console.log('✔ Cleared users, vehicles, drivers\n');

  // ── Users — hash passwords ourselves so we don't depend on the pre-save hook ─
  const salt = await bcrypt.genSalt(12);
  const hashedPw = await bcrypt.hash('password123', salt);

  await User.insertMany([
    { name: 'Admin Manager',  email: 'fleet@transitops.com',    password: hashedPw, role: 'fleet_manager'     },
    { name: 'Jay Dispatcher', email: 'dispatch@transitops.com', password: hashedPw, role: 'dispatcher'        },
    { name: 'Sara Safety',    email: 'safety@transitops.com',   password: hashedPw, role: 'safety_officer'    },
    { name: 'Raj Finance',    email: 'finance@transitops.com',  password: hashedPw, role: 'financial_analyst' },
  ]);
  console.log('✔ Seeded 4 users');

  // ── Vehicles ────────────────────────────────────────────────────────────────
  const nextYear = new Date(); nextYear.setFullYear(nextYear.getFullYear() + 2);

  await Vehicle.insertMany([
    { regNumber: 'MH12AB1234', name: 'Tata Ace Van-01',        type: 'Van',        maxLoadCapacity: 750,   odometer: 42300,  acquisitionCost: 850000,  status: 'Available', region: 'Mumbai',    lat: 19.0760, lng: 72.8777 },
    { regNumber: 'MH12CD5678', name: 'Ashok Leyland Truck-02', type: 'Truck',      maxLoadCapacity: 5000,  odometer: 128000, acquisitionCost: 2500000, status: 'Available', region: 'Pune',      lat: 18.5204, lng: 73.8567 },
    { regNumber: 'MH01EF9012', name: 'Mahindra Mini-03',       type: 'Mini Truck', maxLoadCapacity: 1200,  odometer: 67800,  acquisitionCost: 1100000, status: 'In Shop',   region: 'Mumbai',    lat: 19.1136, lng: 72.8697 },
    { regNumber: 'GJ05GH3456', name: 'Eicher Trailer-04',      type: 'Trailer',    maxLoadCapacity: 12000, odometer: 215000, acquisitionCost: 4200000, status: 'Available', region: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { regNumber: 'DL7CJ7890',  name: 'BPCL Tanker-05',         type: 'Tanker',     maxLoadCapacity: 8000,  odometer: 98000,  acquisitionCost: 3500000, status: 'Available', region: 'Delhi',     lat: 28.6139, lng: 77.2090 },
  ]);
  console.log('✔ Seeded 5 vehicles');

  // ── Drivers ─────────────────────────────────────────────────────────────────
  const expired  = new Date('2024-01-01');
  const expiring = new Date(); expiring.setDate(expiring.getDate() + 20);

  await Driver.insertMany([
    { name: 'Ramesh Kumar', licenseNumber: 'MH0120230012345', licenseCategory: 'C', licenseExpiry: nextYear, contact: '9876543210', safetyScore: 92, status: 'Available' },
    { name: 'Suresh Yadav', licenseNumber: 'MH0120240067890', licenseCategory: 'D', licenseExpiry: nextYear, contact: '9812345678', safetyScore: 85, status: 'Available' },
    { name: 'Priya Singh',  licenseNumber: 'DL0120230054321', licenseCategory: 'B', licenseExpiry: expiring, contact: '9988776655', safetyScore: 78, status: 'Available' },
    { name: 'Alex Thomas',  licenseNumber: 'GJ0120220099887', licenseCategory: 'E', licenseExpiry: nextYear, contact: '9900112233', safetyScore: 95, status: 'Available' },
    { name: 'Mohan Das',    licenseNumber: 'MH0120190011223', licenseCategory: 'C', licenseExpiry: expired,  contact: '9123456789', safetyScore: 60, status: 'Off Duty'  },
  ]);
  console.log('✔ Seeded 5 drivers\n');

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('✅  Seed complete!\n');
  console.log('Demo credentials (password: password123 for all):');
  console.log('  fleet@transitops.com    →  Fleet Manager');
  console.log('  dispatch@transitops.com →  Dispatcher');
  console.log('  safety@transitops.com   →  Safety Officer');
  console.log('  finance@transitops.com  →  Financial Analyst\n');

  process.exit(0);
};

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  if (err.errors) console.error('Validation errors:', JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
