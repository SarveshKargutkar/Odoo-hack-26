import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { ToastService } from '../../shared/toast/toast.service';
import { findLocation } from '../constants/locations';

export interface TripSim {
  trip:      any;
  vehicle:   any;
  driver:    any;
  sourceLat: number;  sourceLng: number;
  destLat:   number;  destLng:   number;
  progress:  number;  // 0 → 1
  arrived:   boolean;
  notified:  boolean; // has arrival toast been shown?
}

/** 1-minute simulation: dispatched trip travels source→destination in 60 seconds */
const TRIP_DURATION_MS = 60 * 1000;

@Injectable({ providedIn: 'root' })
export class TripSimulationService implements OnDestroy {
  private simsMap   = new Map<string, TripSim>();
  private sims$     = new BehaviorSubject<TripSim[]>([]);
  simulations$      = this.sims$.asObservable();

  private dataTimer?: ReturnType<typeof setInterval>;
  private animTimer?: ReturnType<typeof setInterval>;
  private started   = false;

  constructor(
    private api:    ApiService,
    private toast:  ToastService,
    private router: Router,
  ) {}

  /** Call once from AppComponent after login check */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.loadDispatched();
    this.dataTimer = setInterval(() => this.loadDispatched(), 30_000);
    this.animTimer = setInterval(() => this.tick(),          2_000);
  }

  stop(): void {
    clearInterval(this.dataTimer);
    clearInterval(this.animTimer);
    this.started = false;
    this.simsMap.clear();
    this.emit();
  }

  ngOnDestroy(): void { this.stop(); }

  // ── Data sync ─────────────────────────────────────────────────────────────

  private loadDispatched(): void {
    this.api.getTrips({ status: 'Dispatched' }).subscribe({
      next: (trips: any[]) => this.sync(trips),
      error: () => {}  // silently ignore (user might be on login page)
    });
  }

  private sync(trips: any[]): void {
    const incomingIds = new Set(trips.map((t: any) => t._id as string));

    // Remove sims for trips no longer dispatched
    for (const id of [...this.simsMap.keys()]) {
      if (!incomingIds.has(id)) this.simsMap.delete(id);
    }

    // Add sims for new dispatched trips
    for (const trip of trips) {
      if (this.simsMap.has(trip._id)) {
        // Refresh trip data (driver/vehicle may have changed)
        const existing = this.simsMap.get(trip._id)!;
        existing.trip    = trip;
        existing.vehicle = trip.vehicle;
        existing.driver  = trip.driver;
        continue;
      }

      const srcLoc = findLocation(trip.source);
      const dstLoc = findLocation(trip.destination);
      if (!srcLoc || !dstLoc) continue; // can't simulate without known coords

      const elapsed  = Date.now() - new Date(trip.startedAt).getTime();
      const progress = Math.min(1, elapsed / TRIP_DURATION_MS);

      this.simsMap.set(trip._id, {
        trip,
        vehicle:   trip.vehicle,
        driver:    trip.driver,
        sourceLat: srcLoc.lat, sourceLng: srcLoc.lng,
        destLat:   dstLoc.lat, destLng:   dstLoc.lng,
        progress,
        arrived:   progress >= 1,
        notified:  progress >= 1, // don't re-notify for already-arrived trips
      });
    }

    this.emit();
  }

  // ── Animation tick ─────────────────────────────────────────────────────────

  private tick(): void {
    let changed = false;

    for (const sim of this.simsMap.values()) {
      if (sim.arrived) continue;

      const elapsed  = Date.now() - new Date(sim.trip.startedAt).getTime();
      const progress = Math.min(1, elapsed / TRIP_DURATION_MS);

      if (progress !== sim.progress) {
        sim.progress = progress;
        changed = true;
      }

      if (progress >= 1 && !sim.arrived) {
        sim.arrived = true;
        this.onArrived(sim);
        changed = true;
      }
    }

    if (changed) this.emit();
  }

  private onArrived(sim: TripSim): void {
    if (sim.notified) return;
    sim.notified = true;

    const reg  = sim.vehicle?.regNumber || 'A vehicle';
    const dst  = sim.trip.destination   || 'destination';
    const code = sim.trip.tripCode      || '';

    // Persistent toast (duration 0 = never auto-dismiss) so it stays until dismissed
    this.toast.info(
      `🎉 ${reg} arrived at ${dst} (${code}) — open Fleet Map to complete`,
      0
    );
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Remove a sim after the user completes the trip */
  removeSim(tripId: string): void {
    this.simsMap.delete(tripId);
    this.emit();
    this.loadDispatched();
  }

  private emit(): void {
    this.sims$.next([...this.simsMap.values()]);
  }
}
