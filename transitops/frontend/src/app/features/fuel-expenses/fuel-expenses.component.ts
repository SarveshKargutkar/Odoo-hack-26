import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { FuelLog, Expense, Vehicle } from '../../core/models/models';

@Component({
  selector: 'app-fuel-expenses',
  templateUrl: './fuel-expenses.component.html',
})
export class FuelExpensesComponent implements OnInit {
  fuelLogs: FuelLog[] = [];
  expenses: Expense[] = [];
  vehicles: Vehicle[] = [];
  loading = true;
  activeTab: 'fuel' | 'expenses' = 'fuel';
  showFuelModal = false;
  showExpenseModal = false;
  fuelForm: FormGroup;
  expenseForm: FormGroup;
  error = '';
  saving = false;

  expenseTypes = ['Toll', 'Repair', 'Fine', 'Loading', 'Unloading', 'Other'];
  today = new Date().toISOString().substring(0, 10);

  /** Dispatcher can view; fleet_manager + financial_analyst can add/delete */
  get canManage(): boolean {
    const r = this.auth.currentUser?.role;
    return r === 'fleet_manager' || r === 'financial_analyst';
  }

  constructor(private api: ApiService, private fb: FormBuilder, public auth: AuthService) {
    this.fuelForm = this.fb.group({
      vehicle: ['', Validators.required],
      liters: [null, [Validators.required, Validators.min(0.1)]],
      costPerLiter: [null, [Validators.required, Validators.min(0)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      odometer: [null, [Validators.required, Validators.min(0)]],
      stationName: [''],
      notes: ['']
    });
    this.expenseForm = this.fb.group({
      vehicle: ['', Validators.required],
      type: ['Toll', Validators.required],
      description: [''],
      amount: [null, [Validators.required, Validators.min(0)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required]
    });
  }

  ngOnInit(): void {
    this.load();
    this.api.getVehicles().subscribe({ next: v => this.vehicles = v, error: () => {} });
  }

  load(): void {
    this.loading = true;
    Promise.all([
      this.api.getFuelLogs().toPromise(),
      this.api.getExpenses().toPromise()
    ]).then(([f, e]) => {
      this.fuelLogs = f || [];
      this.expenses = e || [];
      this.loading = false;
    }).catch(() => this.loading = false);
  }

  totalFuelCost(): number { return this.fuelLogs.reduce((s, f) => s + (f.totalCost || 0), 0); }
  totalExpenses(): number { return this.expenses.reduce((s, e) => s + e.amount, 0); }

  saveFuel(): void {
    if (this.fuelForm.invalid || this.saving) return;
    this.saving = true; this.error = '';
    this.api.createFuelLog(this.fuelForm.value).subscribe({
      next: () => { this.showFuelModal = false; this.load(); this.saving = false; },
      error: err => { this.error = err.error?.message || 'Failed'; this.saving = false; }
    });
  }

  saveExpense(): void {
    if (this.expenseForm.invalid || this.saving) return;
    this.saving = true; this.error = '';
    this.api.createExpense(this.expenseForm.value).subscribe({
      next: () => { this.showExpenseModal = false; this.load(); this.saving = false; },
      error: err => { this.error = err.error?.message || 'Failed'; this.saving = false; }
    });
  }

  deleteFuel(id: string): void {
    if (!confirm('Delete this fuel log?')) return;
    this.api.deleteFuelLog(id).subscribe({ next: () => this.load() });
  }

  deleteExpense(id: string): void {
    if (!confirm('Delete this expense?')) return;
    this.api.deleteExpense(id).subscribe({ next: () => this.load() });
  }

  asVehicle(v: any): Vehicle | null { return typeof v === 'object' ? v : null; }

  exportFuelCSV(): void {
    const h = ['Vehicle', 'Liters', 'Cost/L', 'Total Cost', 'Date', 'Odometer', 'Station'];
    const r = this.fuelLogs.map(f => [this.asVehicle(f.vehicle)?.regNumber || '', f.liters, f.costPerLiter, f.totalCost, f.date?.substring(0, 10), f.odometer, f.stationName]);
    const csv = [h, ...r].map(x => x.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'fuel_logs.csv'; a.click();
  }
}
