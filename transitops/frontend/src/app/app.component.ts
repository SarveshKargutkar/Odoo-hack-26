import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { TripSimulationService } from './core/services/trip-simulation.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet><app-toast></app-toast>',
})
export class AppComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private tripSim: TripSimulationService,
  ) {}

  ngOnInit(): void {
    // Prevent typing '-' in any number input across the whole app
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const t = e.target as HTMLInputElement;
      if (t.tagName === 'INPUT' && t.type === 'number' && e.key === '-') {
        e.preventDefault();
      }
    });

    if (this.auth.isLoggedIn) this.tripSim.start();
    this.auth.user$.subscribe(user => {
      if (user) this.tripSim.start();
      else       this.tripSim.stop();
    });
  }
}
