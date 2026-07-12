import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { DashboardKPIs, Driver, Trip, Vehicle } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  kpis: DashboardKPIs | null = null;
  recentTrips: Trip[] = [];
  vehicles: Vehicle[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  asVehicle(v: any): Vehicle | null { return typeof v === 'object' ? v : null; }
  asDriver(d: any): Driver | null { return typeof d === 'object' ? d : null; }

  ngOnInit(): void {
    this.api.getKPIs().subscribe({ next: d => { this.kpis = d; this.loading = false; }, error: () => { this.loading = false; } });
    this.api.getTrips({ status: 'Dispatched' }).subscribe({ next: t => this.recentTrips = t.slice(0, 8), error: () => {} });
    this.api.getVehicles().subscribe({ next: v => this.vehicles = v.slice(0, 8), error: () => {} });
  }
}
