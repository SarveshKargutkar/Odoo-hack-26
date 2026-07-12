import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { MaintenanceLog, Vehicle } from '../../core/models/models';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
})
export class MaintenanceComponent implements OnInit {
  logs: MaintenanceLog[] = [];
  vehicles: Vehicle[] = [];
  loading = true;
  showModal = false;
  showCloseModal = false;
  closingLog: MaintenanceLog | null = null;
  form: FormGroup;
  closeForm: FormGroup;
  error = '';
  saving = false;
  filterStatus = '';

  maintenanceTypes = ['Oil Change', 'Tire Replacement', 'Brake Service', 'Engine Repair', 'AC Service', 'Battery', 'General Inspection', 'Other'];

  get canManage(): boolean { return this.auth.currentUser?.role === 'fleet_manager'; }

  constructor(private api: ApiService, private fb: FormBuilder, private toast: ToastService, public auth: AuthService) {
    this.form = this.fb.group({
      vehicle: ['', Validators.required],
      type: ['Oil Change', Validators.required],
      description: [''],
      cost: [0, Validators.min(0)],
      startDate: [new Date().toISOString().substring(0, 10), Validators.required],
      vendor: ['']
    });
    this.closeForm = this.fb.group({ cost: [0, Validators.min(0)] });
  }

  ngOnInit(): void {
    this.load();
    this.api.getVehicles().subscribe({ next: v => this.vehicles = v.filter(x => x.status !== 'Retired'), error: () => {} });
  }

  load(): void {
    this.loading = true;
    const params = this.filterStatus ? { status: this.filterStatus } : {};
    this.api.getMaintenanceLogs(params).subscribe({
      next: l => { this.logs = l; this.loading = false; },
      error: () => this.loading = false
    });
  }

  openAdd(): void { this.form.reset({ type: 'Oil Change', cost: 0, startDate: new Date().toISOString().substring(0, 10) }); this.error = ''; this.showModal = true; }
  closeModal(): void { this.showModal = false; this.error = ''; }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true; this.error = '';
    this.api.createMaintenanceLog(this.form.value).subscribe({
      next: () => { this.closeModal(); this.load(); this.saving = false; this.toast.success('Maintenance logged — vehicle set to In Shop'); },
      error: err => { this.error = err.error?.message || 'Failed to create'; this.toast.error(this.error); this.saving = false; }
    });
  }

  openClose(log: MaintenanceLog): void {
    this.closingLog = log;
    this.closeForm.setValue({ cost: log.cost || 0 });
    this.showCloseModal = true;
  }

  confirmClose(): void {
    if (!this.closingLog) return;
    this.api.closeMaintenanceLog(this.closingLog._id, this.closeForm.value).subscribe({
      next: () => { this.showCloseModal = false; this.closingLog = null; this.load(); this.toast.success('Maintenance closed — vehicle is now Available'); },
      error: err => this.toast.error(err.error?.message || 'Failed to close')
    });
  }

  asVehicle(v: any): Vehicle | null { return typeof v === 'object' ? v : null; }

  totalCost(): number { return this.logs.reduce((s, l) => s + (l.cost || 0), 0); }
}
