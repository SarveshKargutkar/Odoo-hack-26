import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AnalyticsVehicle, AnalyticsSummary } from '../../core/models/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('fuelChart') fuelChartRef!: ElementRef;
  @ViewChild('costChart') costChartRef!: ElementRef;

  vehicles: AnalyticsVehicle[] = [];
  summary: AnalyticsSummary | null = null;
  loading = true;
  fuelChart: any = null;
  costChart: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  ngAfterViewInit(): void {}

  load(): void {
    this.loading = true;
    Promise.all([
      this.api.getAnalyticsVehicles().toPromise(),
      this.api.getAnalyticsSummary().toPromise()
    ]).then(([v, s]) => {
      this.vehicles = v || [];
      this.summary = s || null;
      this.loading = false;
      setTimeout(() => this.renderCharts(), 250);
    }).catch(() => this.loading = false);
  }

  renderCharts(): void {
    if (!this.fuelChartRef || !this.costChartRef) return;

    const labels = this.vehicles.map(v => v.regNumber);
    const fuelEfficiency = this.vehicles.map(v => v.fuelEfficiency);
    const costs = this.vehicles.map(v => v.operationalCost);
    const revenues = this.vehicles.map(v => v.totalRevenue);

    if (this.fuelChart) this.fuelChart.destroy();
    this.fuelChart = new Chart(this.fuelChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'km/L',
          data: fuelEfficiency,
          backgroundColor: '#2563eb',
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });

    if (this.costChart) this.costChart.destroy();
    this.costChart = new Chart(this.costChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Op. Cost (₹)', data: costs, backgroundColor: '#dc2626', borderRadius: 4 },
          { label: 'Revenue (₹)', data: revenues, backgroundColor: '#059669', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  exportCSV(): void {
    const h = ['Reg No', 'Name', 'Type', 'Trips', 'Distance (km)', 'Fuel (L)', 'Fuel Cost', 'Maint. Cost', 'Other Expenses', 'Op. Cost', 'Revenue', 'Fuel Eff. (km/L)', 'ROI (%)'];
    const r = this.vehicles.map(v => [v.regNumber, v.name, v.type, v.totalTrips, v.totalDistance, v.totalFuelLiters, v.totalFuelCost, v.totalMaintenanceCost, v.totalExpenses, v.operationalCost, v.totalRevenue, v.fuelEfficiency, v.roi]);
    const csv = [h, ...r].map(x => x.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'analytics.csv'; a.click();
  }
}
