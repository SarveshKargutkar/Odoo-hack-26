export interface User {
  id: string;
  name: string;
  email: string;
  role: 'fleet_manager' | 'dispatcher' | 'safety_officer' | 'financial_analyst';
}

export interface Vehicle {
  _id: string;
  regNumber: string;
  name: string;
  type: 'Truck' | 'Van' | 'Mini Truck' | 'Bike' | 'Tanker' | 'Trailer';
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
  region: string;
  notes: string;
  lat?: number | null;
  lng?: number | null;
  createdAt: string;
}

export interface Driver {
  _id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: 'A' | 'B' | 'C' | 'D' | 'E';
  licenseExpiry: string;
  contact: string;
  safetyScore: number;
  status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
  notes: string;
  licenseExpired: boolean;
  createdAt: string;
}

export interface Trip {
  _id: string;
  tripCode: string;
  source: string;
  destination: string;
  vehicle: Vehicle | string;
  driver: Driver | string;
  cargoWeight: number;
  plannedDistance: number;
  status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
  actualDistance: number;
  fuelConsumed: number;
  endOdometer: number;
  revenue: number;
  startedAt: string;
  completedAt: string;
  notes: string;
  createdAt: string;
}

export interface MaintenanceLog {
  _id: string;
  vehicle: Vehicle | string;
  type: string;
  description: string;
  cost: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Closed';
  vendor: string;
  createdAt: string;
}

export interface FuelLog {
  _id: string;
  vehicle: Vehicle | string;
  trip: Trip | string | null;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  date: string;
  odometer: number;
  stationName: string;
  notes: string;
}

export interface Expense {
  _id: string;
  vehicle: Vehicle | string;
  trip: Trip | string | null;
  type: string;
  description: string;
  amount: number;
  date: string;
}

export interface DashboardKPIs {
  totalVehicles: number;
  available: number;
  onTrip: number;
  inShop: number;
  retired: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  totalDrivers: number;
  fleetUtilization: number;
  expiringLicenses: number;
}

export interface AnalyticsVehicle {
  vehicleId: string;
  regNumber: string;
  name: string;
  type: string;
  status: string;
  acquisitionCost: number;
  totalTrips: number;
  totalDistance: number;
  totalFuelLiters: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalExpenses: number;
  operationalCost: number;
  totalRevenue: number;
  fuelEfficiency: number;
  roi: number;
}

export interface AnalyticsSummary {
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalExpenses: number;
  totalOperationalCost: number;
  totalRevenue: number;
  totalDistance: number;
  totalFuelLiters: number;
  avgFuelEfficiency: number;
  completedTrips: number;
}
