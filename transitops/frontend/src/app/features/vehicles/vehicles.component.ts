import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Vehicle } from '../../core/models/models';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.component.html',
})
export class VehiclesComponent implements OnInit {
  vehicles: Vehicle[] = [];
  filtered: Vehicle[] = [];
  loading = true;
  showModal = false;
  editingId: string | null = null;
  form: FormGroup;
  error = '';
  saving = false;
  filterStatus = '';
  filterType = '';
  search = '';

  // Retire modal
  showRetireModal = false;
  retiringVehicle: Vehicle | null = null;

  vehicleTypes = ['Truck', 'Van', 'Mini Truck', 'Bike', 'Tanker', 'Trailer'];
  statuses     = ['Available', 'On Trip', 'In Shop', 'Retired'];
  regions      = [
    'Mumbai', 'Pune', 'Delhi', 'Bangalore', 'Chennai',
    'Hyderabad', 'Ahmedabad', 'Kolkata', 'Surat', 'Jaipur',
    'Nagpur', 'Nashik', 'Vadodara', 'Indore', 'Bhopal',
    'Kochi', 'Lucknow', 'Patna', 'Guwahati', 'Vijayawada'
  ];

  constructor(
    private api:   ApiService,
    private fb:    FormBuilder,
    private toast: ToastService,
    public  auth:  AuthService,
  ) {
    this.form = this.fb.group({
      regNumber:       ['', Validators.required],
      name:            ['', Validators.required],
      type:            ['Truck', Validators.required],
      maxLoadCapacity: [null, [Validators.required, Validators.min(1)]],
      odometer:        [0, Validators.min(0)],
      acquisitionCost: [null, [Validators.required, Validators.min(0)]],
      region:          [''],
      notes:           ['']
    });
  }

  /** Only fleet managers can create, edit, or retire vehicles */
  get canManage(): boolean { return this.auth.currentUser?.role === 'fleet_manager'; }

  get saveTooltip(): string {
    if (!this.canManage)     return 'Only Fleet Managers can manage vehicles';
    if (this.form.invalid)   return 'Fill in all required fields';
    if (this.saving)         return 'Saving…';
    return '';
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.getVehicles().subscribe({
      next: v => { this.vehicles = v; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    this.filtered = this.vehicles.filter(v => {
      const matchSearch = !this.search ||
        v.regNumber.toLowerCase().includes(this.search.toLowerCase()) ||
        v.name.toLowerCase().includes(this.search.toLowerCase());
      const matchStatus = !this.filterStatus || v.status === this.filterStatus;
      const matchType   = !this.filterType   || v.type   === this.filterType;
      return matchSearch && matchStatus && matchType;
    });
  }

  openAdd(): void {
    if (!this.canManage) return;
    this.editingId = null;
    this.form.reset({ type: 'Truck', odometer: 0 });
    this.form.get('regNumber')?.enable();
    this.error = '';
    this.showModal = true;
  }

  openEdit(v: Vehicle): void {
    if (!this.canManage) return;
    this.editingId = v._id;
    this.form.patchValue(v);
    this.form.get('regNumber')?.disable();
    this.error = '';
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.error = ''; }

  save(): void {
    if (!this.canManage || this.form.invalid || this.saving) return;
    this.saving = true;
    this.error  = '';
    const data  = this.form.getRawValue();
    const req   = this.editingId
      ? this.api.updateVehicle(this.editingId, data)
      : this.api.createVehicle(data);
    req.subscribe({
      next:  () => { this.closeModal(); this.load(); this.saving = false; this.toast.success(this.editingId ? 'Vehicle updated' : 'Vehicle registered'); },
      error: err => { this.error = err.error?.message || 'Failed to save'; this.toast.error(this.error); this.saving = false; }
    });
  }

  // ── Retire flow ────────────────────────────────────────────────────────────

  openRetire(v: Vehicle): void {
    if (!this.canManage) return;
    this.retiringVehicle = v;
    this.showRetireModal = true;
  }

  confirmRetire(): void {
    if (!this.retiringVehicle) return;
    this.api.deleteVehicle(this.retiringVehicle._id).subscribe({
      next: () => {
        this.showRetireModal  = false;
        this.retiringVehicle  = null;
        this.load();
        this.toast.warning('Vehicle retired from fleet');
      },
      error: err => this.toast.error(err.error?.message || 'Failed to retire vehicle')
    });
  }

  cancelRetire(): void { this.showRetireModal = false; this.retiringVehicle = null; }

  exportCSV(): void {
    const headers = ['Reg No', 'Name', 'Type', 'Capacity (kg)', 'Odometer (km)', 'Acquisition Cost', 'Status', 'Region'];
    const rows = this.filtered.map(v => [v.regNumber, v.name, v.type, v.maxLoadCapacity, v.odometer, v.acquisitionCost, v.status, v.region]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'vehicles.csv';
    a.click();
  }
}
