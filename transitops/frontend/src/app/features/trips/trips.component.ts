import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Trip, Vehicle, Driver } from '../../core/models/models';
import { ToastService } from '../../shared/toast/toast.service';
import { LOCATIONS, findLocation, haversineKm } from '../../core/constants/locations';

@Component({
  selector: 'app-trips',
  templateUrl: './trips.component.html',
})
export class TripsComponent implements OnInit {
  trips:    Trip[]    = [];
  filtered: Trip[]    = [];
  vehicles: Vehicle[] = [];
  drivers:  Driver[]  = [];
  loading  = true;
  showModal         = false;
  showCompleteModal = false;
  completingTrip: Trip | null = null;
  form:         FormGroup;
  completeForm: FormGroup;
  error   = '';
  saving  = false;
  filterStatus = '';
  statuses = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

  readonly locations = LOCATIONS;

  /** fleet_manager + dispatcher can create/dispatch/cancel trips */
  get canCreate(): boolean {
    const r = this.auth.currentUser?.role;
    return r === 'fleet_manager' || r === 'dispatcher';
  }

  get formDisabledReason(): string {
    if (!this.canCreate)           return 'Only Dispatchers and Fleet Managers can create trips';
    if (this.cargoExceedsCapacity) return `Cargo weight exceeds ${this.selectedVehicle?.name}'s capacity`;
    if (this.form.invalid)         return 'Fill in all required fields';
    return '';
  }

  constructor(
    private api:   ApiService,
    private fb:    FormBuilder,
    private toast: ToastService,
    public  auth:  AuthService,
  ) {
    this.form = this.fb.group({
      source:          ['', Validators.required],
      destination:     ['', Validators.required],
      vehicle:         ['', Validators.required],
      driver:          ['', Validators.required],
      cargoWeight:     [null, [Validators.required, Validators.min(1)]],
      plannedDistance: [null, [Validators.required, Validators.min(1)]],
      revenue:         [0],
      notes:           ['']
    });

    this.completeForm = this.fb.group({
      actualDistance:   [null, [Validators.required, Validators.min(0)]],
      fuelConsumed:     [null, [Validators.required, Validators.min(0)]],
      fuelCostPerLiter: [0,    Validators.min(0)],
      endOdometer:      [null, Validators.min(0)],
      revenue:          [0,    Validators.min(0)],
      tollCharges:      [0,    Validators.min(0)],
      loadingCharges:   [0,    Validators.min(0)],
      unloadingCharges: [0,    Validators.min(0)],
      fineAmount:       [0,    Validators.min(0)],
      repairCost:       [0,    Validators.min(0)],
      otherExpenses:    [0,    Validators.min(0)],
    });

    // Auto-recalculate endOdometer = vehicle base odometer + actual distance
    this.completeForm.get('actualDistance')?.valueChanges.subscribe(dist => {
      if (dist != null && Number(dist) >= 0) {
        const baseOdo = (this.completingTrip?.vehicle as any)?.odometer ?? 0;
        this.completeForm.patchValue({ endOdometer: baseOdo + Number(dist) }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.load();
    this.api.getVehicles({ status: 'Available' }).subscribe({ next: v => this.vehicles = v, error: () => {} });
    this.api.getDrivers({ status: 'Available' }).subscribe({ next: d => this.drivers = d, error: () => {} });
  }

  // ── Filters / load ─────────────────────────────────────────────────────────

  load(): void {
    this.loading = true;
    this.api.getTrips().subscribe({
      next: t => { this.trips = t; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    this.filtered = this.filterStatus
      ? this.trips.filter(t => t.status === this.filterStatus)
      : [...this.trips];
  }

  // ── Auto-calculate distance ────────────────────────────────────────────────

  onLocationChange(): void {
    const srcName = this.form.get('source')?.value?.trim();
    const dstName = this.form.get('destination')?.value?.trim();
    const src     = findLocation(srcName);
    const dst     = findLocation(dstName);
    if (src && dst) {
      const km = Math.round(haversineKm(src.lat, src.lng, dst.lat, dst.lng));
      this.form.get('plannedDistance')?.setValue(km);
    }
  }

  // ── Weight vs capacity validation ─────────────────────────────────────────

  get selectedVehicle(): Vehicle | null {
    const id = this.form.get('vehicle')?.value;
    return this.vehicles.find(v => v._id === id) || null;
  }

  get cargoExceedsCapacity(): boolean {
    const v      = this.selectedVehicle;
    const weight = this.form.get('cargoWeight')?.value;
    return !!v && weight > 0 && weight > v.maxLoadCapacity;
  }

  get formSubmittable(): boolean {
    return this.canCreate && this.form.valid && !this.cargoExceedsCapacity && !this.saving;
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  openAdd(): void { this.form.reset({ revenue: 0 }); this.error = ''; this.showModal = true; }
  closeModal(): void { this.showModal = false; this.error = ''; }

  create(): void {
    if (!this.formSubmittable) return;
    this.saving = true; this.error = '';
    this.api.createTrip(this.form.value).subscribe({
      next: () => {
        this.closeModal(); this.load(); this.saving = false;
        this.toast.success('Trip created successfully');
        this.api.getVehicles({ status: 'Available' }).subscribe({ next: v => this.vehicles = v, error: () => {} });
        this.api.getDrivers({ status: 'Available' }).subscribe({ next: d => this.drivers = d, error: () => {} });
      },
      error: err => { this.error = err.error?.message || 'Failed to create trip'; this.toast.error(this.error); this.saving = false; }
    });
  }

  dispatch(trip: Trip): void {
    if (!this.canCreate) return;
    if (!confirm(`Dispatch trip ${trip.tripCode}?`)) return;
    this.api.dispatchTrip(trip._id).subscribe({
      next: () => { this.load(); this.toast.success('Trip dispatched — vehicle and driver are now On Trip'); },
      error: err => this.toast.error(err.error?.message || 'Dispatch failed')
    });
  }

  openComplete(trip: Trip): void {
    this.completingTrip = trip;
    const v       = trip.vehicle as Vehicle;
    const baseOdo = v?.odometer || 0;
    const planDist = trip.plannedDistance || 0;
    this.completeForm.reset({
      actualDistance:   planDist,
      fuelConsumed:     0, fuelCostPerLiter: 0,
      endOdometer:      baseOdo + planDist,
      revenue:          trip.revenue || 0,
      tollCharges: 0, loadingCharges: 0, unloadingCharges: 0,
      fineAmount: 0, repairCost: 0, otherExpenses: 0,
    });
    this.showCompleteModal = true;
  }

  confirmComplete(): void {
    if (!this.completingTrip || this.completeForm.invalid) return;
    const formVal   = this.completeForm.value;
    const tripId    = this.completingTrip._id;
    const vehicleId = typeof this.completingTrip.vehicle === 'object'
      ? (this.completingTrip.vehicle as any)._id
      : this.completingTrip.vehicle;

    this.api.completeTrip(tripId, formVal).subscribe({
      next: () => {
        const expenseDefs = [
          { type: 'Toll',      amount: formVal.tollCharges,      description: 'Toll charges'             },
          { type: 'Loading',   amount: formVal.loadingCharges,   description: 'Loading charges'          },
          { type: 'Unloading', amount: formVal.unloadingCharges, description: 'Unloading charges'        },
          { type: 'Fine',      amount: formVal.fineAmount,       description: 'Fine/penalty during trip' },
          { type: 'Repair',    amount: formVal.repairCost,       description: 'Repair cost during trip'  },
          { type: 'Other',     amount: formVal.otherExpenses,    description: 'Other trip expenses'      },
        ].filter(e => e.amount > 0);

        Promise.all(expenseDefs.map(e =>
          this.api.createExpense({ ...e, vehicle: vehicleId, trip: tripId, date: new Date().toISOString() }).toPromise()
        )).then(() => {
          this.showCompleteModal = false;
          this.completingTrip    = null;
          this.load();
          const n = expenseDefs.length;
          this.toast.success(n > 0 ? `Trip completed — ${n} expense(s) auto-logged` : 'Trip completed — vehicle and driver are Available');
        });
      },
      error: err => this.toast.error(err.error?.message || 'Failed to complete trip')
    });
  }

  cancel(trip: Trip): void {
    if (!this.canCreate) return;
    if (!confirm(`Cancel trip ${trip.tripCode}?`)) return;
    this.api.cancelTrip(trip._id).subscribe({
      next: () => { this.load(); this.toast.warning('Trip cancelled'); },
      error: err => this.toast.error(err.error?.message || 'Cancel failed')
    });
  }

  asVehicle(v: any): Vehicle | null { return typeof v === 'object' ? v : null; }
  asDriver (d: any): Driver  | null { return typeof d === 'object' ? d : null; }
}
