import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  Vehicle,
  Driver,
  Trip,
  MaintenanceLog,
  FuelLog,
  Expense,
  DashboardKPIs,
  AnalyticsVehicle,
  AnalyticsSummary,
} from "../models/models";

const BASE = "http://localhost:3000/api";

@Injectable({ providedIn: "root" })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Dashboard
  getKPIs(): Observable<DashboardKPIs> {
    return this.http.get<DashboardKPIs>(`${BASE}/dashboard/kpis`);
  }

  // Vehicles
  getVehicles(params?: any): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${BASE}/vehicles`, { params });
  }
  getVehicle(id: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${BASE}/vehicles/${id}`);
  }
  createVehicle(data: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${BASE}/vehicles`, data);
  }
  updateVehicle(id: string, data: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${BASE}/vehicles/${id}`, data);
  }
  deleteVehicle(id: string): Observable<any> {
    return this.http.delete(`${BASE}/vehicles/${id}`);
  }

  // Drivers
  getDrivers(params?: any): Observable<Driver[]> {
    return this.http.get<Driver[]>(`${BASE}/drivers`, { params });
  }
  getDriver(id: string): Observable<Driver> {
    return this.http.get<Driver>(`${BASE}/drivers/${id}`);
  }
  createDriver(data: Partial<Driver>): Observable<Driver> {
    return this.http.post<Driver>(`${BASE}/drivers`, data);
  }
  updateDriver(id: string, data: Partial<Driver>): Observable<Driver> {
    return this.http.put<Driver>(`${BASE}/drivers/${id}`, data);
  }
  deleteDriver(id: string): Observable<any> {
    return this.http.delete(`${BASE}/drivers/${id}`);
  }

  // Trips
  getTrips(params?: any): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${BASE}/trips`, { params });
  }
  getTrip(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${BASE}/trips/${id}`);
  }
  createTrip(data: Partial<Trip>): Observable<Trip> {
    return this.http.post<Trip>(`${BASE}/trips`, data);
  }
  dispatchTrip(id: string): Observable<Trip> {
    return this.http.patch<Trip>(`${BASE}/trips/${id}/dispatch`, {});
  }
  completeTrip(id: string, data: any): Observable<Trip> {
    return this.http.patch<Trip>(`${BASE}/trips/${id}/complete`, data);
  }
  cancelTrip(id: string): Observable<Trip> {
    return this.http.patch<Trip>(`${BASE}/trips/${id}/cancel`, {});
  }

  // Maintenance
  getMaintenanceLogs(params?: any): Observable<MaintenanceLog[]> {
    return this.http.get<MaintenanceLog[]>(`${BASE}/maintenance`, { params });
  }
  createMaintenanceLog(
    data: Partial<MaintenanceLog>,
  ): Observable<MaintenanceLog> {
    return this.http.post<MaintenanceLog>(`${BASE}/maintenance`, data);
  }
  closeMaintenanceLog(id: string, data: any): Observable<MaintenanceLog> {
    return this.http.patch<MaintenanceLog>(
      `${BASE}/maintenance/${id}/close`,
      data,
    );
  }
  deleteMaintenanceLog(id: string): Observable<any> {
    return this.http.delete(`${BASE}/maintenance/${id}`);
  }

  // Fuel Logs
  getFuelLogs(params?: any): Observable<FuelLog[]> {
    return this.http.get<FuelLog[]>(`${BASE}/fuel`, { params });
  }
  createFuelLog(data: Partial<FuelLog>): Observable<FuelLog> {
    return this.http.post<FuelLog>(`${BASE}/fuel`, data);
  }
  deleteFuelLog(id: string): Observable<any> {
    return this.http.delete(`${BASE}/fuel/${id}`);
  }

  // Expenses
  getExpenses(params?: any): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${BASE}/expenses`, { params });
  }
  createExpense(data: Partial<Expense>): Observable<Expense> {
    return this.http.post<Expense>(`${BASE}/expenses`, data);
  }
  deleteExpense(id: string): Observable<any> {
    return this.http.delete(`${BASE}/expenses/${id}`);
  }

  // Analytics
  getAnalyticsVehicles(): Observable<AnalyticsVehicle[]> {
    return this.http.get<AnalyticsVehicle[]>(`${BASE}/analytics/vehicles`);
  }
  getAnalyticsSummary(): Observable<AnalyticsSummary> {
    return this.http.get<AnalyticsSummary>(`${BASE}/analytics/summary`);
  }
}
