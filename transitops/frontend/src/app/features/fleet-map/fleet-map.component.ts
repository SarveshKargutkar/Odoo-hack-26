import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/toast/toast.service';
import { TripSimulationService, TripSim } from '../../core/services/trip-simulation.service';
import { Vehicle } from '../../core/models/models';

// Fix Leaflet default icon paths for webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MarkerGroup {
  marker:    L.Marker;
  routeLine: L.Polyline;
  srcDot:    L.CircleMarker;
  dstDot:    L.CircleMarker;
}

@Component({
  selector: 'app-fleet-map',
  templateUrl: './fleet-map.component.html',
  styleUrls:  ['./fleet-map.component.css']
})
export class FleetMapComponent implements AfterViewInit, OnDestroy {
  private map!: L.Map;

  // Static vehicle markers (Available / In Shop / Retired)
  private staticMarkers: L.Marker[] = [];

  // Trip markers – keyed by tripId so we can update/remove efficiently
  private tripMarkers = new Map<string, MarkerGroup>();

  vehicles:    Vehicle[]  = [];
  tripSims:    TripSim[]  = [];
  selected:    Vehicle  | null = null;
  selectedSim: TripSim  | null = null;
  loading = true;

  showCompleteModal = false;
  completingSim: TripSim | null = null;
  completeForm: FormGroup;

  private simsSub!: Subscription;
  private vehicleInterval!: ReturnType<typeof setInterval>;

  /** CustomEvent bridge for "Complete Trip" button inside Leaflet popup HTML */
  private popupHandler = (e: Event) => {
    const tripId = (e as CustomEvent<string>).detail;
    const sim    = this.tripSims.find(s => s.trip._id === tripId);
    if (sim) this.openComplete(sim);
  };

  readonly statusColors: Record<string, string> = {
    'Available': '#059669',
    'On Trip':   '#d97706',
    'In Shop':   '#dc2626',
    'Retired':   '#6b7280',
  };

  constructor(
    private api:    ApiService,
    private toast:  ToastService,
    private simSvc: TripSimulationService,
    private fb:     FormBuilder,
  ) {
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
        const baseOdo = this.completingSim?.vehicle?.odometer ?? 0;
        this.completeForm.patchValue({ endOdometer: baseOdo + Number(dist) }, { emitEvent: false });
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.loadVehicles();
    this.vehicleInterval = setInterval(() => this.loadVehicles(), 30_000);
    window.addEventListener('transitops:completeTrip', this.popupHandler);

    // Subscribe to the global simulation service
    this.simsSub = this.simSvc.simulations$.subscribe(sims => {
      this.tripSims = sims;
      this.syncTripMarkers(sims);
    });
  }

  ngOnDestroy(): void {
    this.simsSub?.unsubscribe();
    clearInterval(this.vehicleInterval);
    window.removeEventListener('transitops:completeTrip', this.popupHandler);
    if (this.map) this.map.remove();
  }

  // ── Map init ───────────────────────────────────────────────────────────────

  private initMap(): void {
    this.map = L.map('fleet-map', { center: [20.5937, 78.9629], zoom: 5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);
  }

  // ── Static vehicles ────────────────────────────────────────────────────────

  loadVehicles(): void {
    this.api.getVehicles().subscribe({
      next: vehicles => {
        this.vehicles = vehicles;
        this.loading  = false;
        this.renderStaticMarkers(vehicles.filter(v => v.status !== 'On Trip'));
      },
      error: () => { this.loading = false; }
    });
  }

  private renderStaticMarkers(vehicles: Vehicle[]): void {
    this.staticMarkers.forEach(m => m.remove());
    this.staticMarkers = [];
    vehicles
      .filter((v: any) => v.lat && v.lng)
      .forEach((v: any) => {
        const color  = this.statusColors[v.status] || '#6b7280';
        const marker = L.marker([v.lat, v.lng], { icon: this.pinIcon(color) })
          .addTo(this.map)
          .bindPopup(this.staticPopupHtml(v), { maxWidth: 260 })
          .on('click', () => { this.selected = v; this.selectedSim = null; });
        this.staticMarkers.push(marker);
      });
  }

  // ── Trip markers (driven by service) ──────────────────────────────────────

  private syncTripMarkers(sims: TripSim[]): void {
    if (!this.map) return;

    const incomingIds = new Set(sims.map(s => s.trip._id as string));

    // Remove markers for sims that no longer exist
    for (const [id, grp] of this.tripMarkers) {
      if (!incomingIds.has(id)) {
        grp.marker.remove();
        grp.routeLine.remove();
        grp.srcDot.remove();
        grp.dstDot.remove();
        this.tripMarkers.delete(id);
      }
    }

    // Add or update
    for (const sim of sims) {
      const id  = sim.trip._id;
      const lat = sim.sourceLat + (sim.destLat - sim.sourceLat) * sim.progress;
      const lng = sim.sourceLng + (sim.destLng - sim.sourceLng) * sim.progress;

      if (this.tripMarkers.has(id)) {
        // Update position + icon
        const grp = this.tripMarkers.get(id)!;
        grp.marker.setLatLng([lat, lng]);
        grp.marker.setIcon(this.truckIcon(sim));
        if (sim.arrived && !grp.marker.isPopupOpen()) {
          this.attachArrivedPopup(grp.marker, sim);
        }
      } else {
        // Create new markers
        const routeLine = L.polyline(
          [[sim.sourceLat, sim.sourceLng], [sim.destLat, sim.destLng]],
          { color: '#2563eb', weight: 2, dashArray: '8 6', opacity: 0.45 }
        ).addTo(this.map);

        const srcDot = L.circleMarker([sim.sourceLat, sim.sourceLng], {
          radius: 7, color: '#059669', fillColor: '#059669', fillOpacity: 1, weight: 2
        }).addTo(this.map).bindTooltip(`From: ${sim.trip.source}`, { direction: 'top' });

        const dstDot = L.circleMarker([sim.destLat, sim.destLng], {
          radius: 7, color: '#dc2626', fillColor: '#dc2626', fillOpacity: 1, weight: 2
        }).addTo(this.map).bindTooltip(`To: ${sim.trip.destination}`, { direction: 'top' });

        const marker = L.marker([lat, lng], { icon: this.truckIcon(sim) })
          .addTo(this.map)
          .on('click', () => { this.selectedSim = sim; this.selected = null; });

        if (sim.arrived) {
          this.attachArrivedPopup(marker, sim);
          this.map.setView([sim.destLat, sim.destLng], 9, { animate: true });
        }

        this.tripMarkers.set(id, { marker, routeLine, srcDot, dstDot });
      }
    }
  }

  private attachArrivedPopup(marker: L.Marker, sim: TripSim): void {
    const html = `
      <div style="font-family:Inter,sans-serif;min-width:220px;padding:2px 0;">
        <div style="font-weight:700;font-size:13.5px;color:#065f46;margin-bottom:6px;">✓ Arrived at Destination</div>
        <div style="font-size:12.5px;font-weight:600;margin-bottom:2px;">${sim.vehicle?.name || '—'}</div>
        <div style="font-size:11.5px;color:#6b7280;margin-bottom:2px;">${sim.vehicle?.regNumber || ''}</div>
        <div style="font-size:11.5px;color:#374151;margin-bottom:2px;">
          ${sim.trip.source} → <strong>${sim.trip.destination}</strong>
        </div>
        <div style="font-size:11.5px;color:#6b7280;margin-bottom:10px;">
          Driver: ${sim.driver?.name || '—'} &nbsp;|&nbsp; ${sim.trip.cargoWeight?.toLocaleString()} kg
        </div>
        <button
          onclick="window.dispatchEvent(new CustomEvent('transitops:completeTrip',{detail:'${sim.trip._id}'}))"
          style="width:100%;padding:8px;background:#059669;color:#fff;border:none;
                 border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;"
        >Complete Trip &amp; Log Expenses →</button>
      </div>`;

    marker.bindPopup(L.popup({ closeOnClick: false, autoClose: false, maxWidth: 260 }).setContent(html)).openPopup();
  }

  // ── Icons ──────────────────────────────────────────────────────────────────

  private truckIcon(sim: TripSim): L.DivIcon {
    const pct   = Math.round(sim.progress * 100);
    const color = sim.arrived ? '#059669' : '#d97706';
    return L.divIcon({
      className: '',
      html: `
        <div style="text-align:center;">
          <div style="
            width:40px;height:40px;background:${color};border:3px solid #fff;
            border-radius:${sim.arrived ? '8px' : '50% 50% 50% 0'};
            transform:${sim.arrived ? 'none' : 'rotate(-45deg)'};
            box-shadow:0 3px 10px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <span style="transform:${sim.arrived ? 'none' : 'rotate(45deg)'};font-size:17px;line-height:1;">
              ${sim.arrived ? '✓' : '🚛'}
            </span>
          </div>
          <div style="
            margin-top:3px;background:${color};color:#fff;font-size:10px;font-weight:700;
            padding:2px 6px;border-radius:10px;white-space:nowrap;display:inline-block;
            box-shadow:0 1px 3px rgba(0,0,0,0.2);">
            ${sim.arrived ? 'Arrived!' : pct + '%'}
          </div>
        </div>`,
      iconSize:    [40, 58],
      iconAnchor:  [20, 54],
      popupAnchor: [0, -56],
    });
  }

  private pinIcon(color: string): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `<div style="
        width:30px;height:30px;background:${color};border:2.5px solid #fff;
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer;"></div>`,
      iconSize:    [30, 30],
      iconAnchor:  [15, 30],
      popupAnchor: [0, -30],
    });
  }

  private staticPopupHtml(v: any): string {
    const color = this.statusColors[v.status] || '#6b7280';
    return `<div style="font-family:Inter,sans-serif;padding:4px 0;">
      <div style="font-weight:600;font-size:14px;margin-bottom:6px;">${v.name}</div>
      <div style="display:grid;gap:4px;font-size:12.5px;color:#374151;">
        <div><span style="color:#9ca3af">Reg:</span> <strong>${v.regNumber}</strong></div>
        <div><span style="color:#9ca3af">Type:</span> ${v.type}</div>
        <div><span style="color:#9ca3af">Region:</span> ${v.region || '—'}</div>
        <div><span style="color:#9ca3af">Capacity:</span> ${v.maxLoadCapacity?.toLocaleString()} kg</div>
        <div><span style="color:#9ca3af">Odometer:</span> ${v.odometer?.toLocaleString()} km</div>
        <div style="margin-top:4px;">
          <span style="background:${color}20;color:${color};padding:2px 8px;
                       border-radius:20px;font-weight:600;font-size:11px;">● ${v.status}</span>
        </div>
      </div></div>`;
  }

  // ── Sidebar interactions ───────────────────────────────────────────────────

  panTo(v: any): void {
    // If vehicle is On Trip, find its active simulation and pan to the moving marker instead
    if (v.status === 'On Trip') {
      const sim = this.tripSims.find(s =>
        (s.vehicle?._id ?? s.vehicle) === (v._id ?? v)
      );
      if (sim) { this.panToSim(sim); return; }
    }

    this.selected = v; this.selectedSim = null;
    if (v.lat && v.lng) {
      this.map.setView([v.lat, v.lng], 12, { animate: true });
      this.staticMarkers
        .find(m => Math.abs(m.getLatLng().lat - v.lat) < 0.001 && Math.abs(m.getLatLng().lng - v.lng) < 0.001)
        ?.openPopup();
    }
  }

  panToSim(sim: TripSim): void {
    this.selectedSim = sim; this.selected = null;
    const lat = sim.sourceLat + (sim.destLat - sim.sourceLat) * sim.progress;
    const lng = sim.sourceLng + (sim.destLng - sim.sourceLng) * sim.progress;
    this.map.setView([lat, lng], 9, { animate: true });
    this.tripMarkers.get(sim.trip._id)?.marker.openPopup();
  }

  // ── Complete trip ──────────────────────────────────────────────────────────

  openComplete(sim: TripSim): void {
    this.completingSim = sim;
    const baseOdo  = sim.vehicle?.odometer || 0;
    const planDist = sim.trip.plannedDistance || 0;
    this.completeForm.reset({
      actualDistance:   planDist,
      fuelConsumed:     0, fuelCostPerLiter: 0,
      endOdometer:      baseOdo + planDist,
      revenue:          sim.trip.revenue || 0,
      tollCharges: 0, loadingCharges: 0, unloadingCharges: 0,
      fineAmount: 0, repairCost: 0, otherExpenses: 0,
    });
    this.showCompleteModal = true;
  }

  confirmComplete(): void {
    if (!this.completingSim || this.completeForm.invalid) return;
    const formVal   = this.completeForm.value;
    const tripId    = this.completingSim.trip._id;
    const vehicleId = this.completingSim.vehicle?._id || this.completingSim.vehicle;

    this.api.completeTrip(tripId, formVal).subscribe({
      next: () => {
        const expenses = [
          { type: 'Toll',      amount: formVal.tollCharges,      description: 'Toll charges'             },
          { type: 'Loading',   amount: formVal.loadingCharges,   description: 'Loading charges'          },
          { type: 'Unloading', amount: formVal.unloadingCharges, description: 'Unloading charges'        },
          { type: 'Fine',      amount: formVal.fineAmount,       description: 'Fine/penalty during trip' },
          { type: 'Repair',    amount: formVal.repairCost,       description: 'Repair cost during trip'  },
          { type: 'Other',     amount: formVal.otherExpenses,    description: 'Other trip expenses'      },
        ].filter(e => e.amount > 0);

        Promise.all(expenses.map(e =>
          this.api.createExpense({ ...e, vehicle: vehicleId, trip: tripId, date: new Date().toISOString() }).toPromise()
        )).then(() => {
          this.simSvc.removeSim(tripId);           // removes from service + re-fetches dispatched trips
          if (this.selectedSim?.trip._id === tripId) this.selectedSim = null;
          this.showCompleteModal = false;
          this.completingSim     = null;
          // Immediately reload vehicles so the now-Available marker appears on the map
          this.loadVehicles();
          const n = expenses.length;
          this.toast.success(n > 0 ? `Trip completed! ${n} expense(s) logged.` : 'Trip completed!');
        });
      },
      error: err => this.toast.error(err.error?.message || 'Failed to complete trip')
    });
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  get statCounts() {
    return {
      available:   this.vehicles.filter(v => v.status === 'Available').length,
      onTrip:      this.vehicles.filter(v => v.status === 'On Trip').length,
      inShop:      this.vehicles.filter(v => v.status === 'In Shop').length,
      activeTrips: this.tripSims.length,
      arrived:     this.tripSims.filter(s => s.arrived).length,
    };
  }

  progressPct(sim: TripSim): number { return Math.round(sim.progress * 100); }
}
