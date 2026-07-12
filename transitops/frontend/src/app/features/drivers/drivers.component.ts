import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Driver } from '../../core/models/models';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
})
export class DriversComponent implements OnInit {
  drivers: Driver[] = [];
  filtered: Driver[] = [];
  loading = true;
  showModal = false;
  editingId: string | null = null;
  form: FormGroup;
  error = '';
  saving = false;
  filterStatus = '';
  search = '';

  statuses = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
  categories = ['A', 'B', 'C', 'D', 'E'];

  /** Only fleet managers can add, edit, or remove drivers; safety officers view-only */
  get canManage(): boolean { return this.auth.currentUser?.role === 'fleet_manager'; }

  constructor(private api: ApiService, private fb: FormBuilder, private toast: ToastService, public auth: AuthService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      licenseNumber: ['', Validators.required],
      licenseCategory: ['C', Validators.required],
      licenseExpiry: ['', Validators.required],
      contact: ['', Validators.required],
      safetyScore: [100, [Validators.min(0), Validators.max(100)]],
      status: ['Available'],
      notes: ['']
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.getDrivers().subscribe({
      next: d => { this.drivers = d; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    this.filtered = this.drivers.filter(d => {
      const matchSearch = !this.search ||
        d.name.toLowerCase().includes(this.search.toLowerCase()) ||
        d.licenseNumber.toLowerCase().includes(this.search.toLowerCase());
      return matchSearch && (!this.filterStatus || d.status === this.filterStatus);
    });
  }

  isExpired(d: Driver): boolean { return new Date(d.licenseExpiry) < new Date(); }
  isExpiringSoon(d: Driver): boolean {
    const exp = new Date(d.licenseExpiry);
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    return exp >= new Date() && exp <= soon;
  }

  openAdd(): void {
    if (!this.canManage) return;
    this.editingId = null; this.form.reset({ licenseCategory: 'C', safetyScore: 100, status: 'Available' }); this.error = ''; this.showModal = true;
  }

  openEdit(d: Driver): void {
    if (!this.canManage) return;
    this.editingId = d._id;
    this.form.patchValue({ ...d, licenseExpiry: d.licenseExpiry.substring(0, 10) });
    this.error = ''; this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.error = ''; }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true; this.error = '';
    const req = this.editingId
      ? this.api.updateDriver(this.editingId, this.form.value)
      : this.api.createDriver(this.form.value);
    req.subscribe({
      next: () => { this.closeModal(); this.load(); this.saving = false; this.toast.success(this.editingId ? 'Driver updated' : 'Driver registered'); },
      error: err => { this.error = err.error?.message || 'Failed to save'; this.toast.error(this.error); this.saving = false; }
    });
  }

  remove(d: Driver): void {
    if (!this.canManage) return;
    if (!confirm(`Remove driver ${d.name}?`)) return;
    this.api.deleteDriver(d._id).subscribe({ next: () => { this.load(); this.toast.success('Driver removed'); } });
  }

  exportCSV(): void {
    const headers = ['Name', 'License No', 'Category', 'Expiry', 'Contact', 'Safety Score', 'Status'];
    const rows = this.filtered.map(d => [d.name, d.licenseNumber, d.licenseCategory, d.licenseExpiry.substring(0, 10), d.contact, d.safetyScore, d.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'drivers.csv'; a.click();
  }
}
