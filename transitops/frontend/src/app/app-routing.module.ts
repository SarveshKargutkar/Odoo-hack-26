import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { LayoutComponent } from './features/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { VehiclesComponent } from './features/vehicles/vehicles.component';
import { DriversComponent } from './features/drivers/drivers.component';
import { TripsComponent } from './features/trips/trips.component';
import { MaintenanceComponent } from './features/maintenance/maintenance.component';
import { FuelExpensesComponent } from './features/fuel-expenses/fuel-expenses.component';
import { AnalyticsComponent } from './features/analytics/analytics.component';
import { FleetMapComponent } from './features/fleet-map/fleet-map.component';

const FM  = ['fleet_manager'];
const ALL = ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'];

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '',             redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',   component: DashboardComponent,    canActivate: [AuthGuard], data: { roles: ALL } },
      { path: 'vehicles',    component: VehiclesComponent,     canActivate: [AuthGuard], data: { roles: FM } },
      { path: 'drivers',     component: DriversComponent,      canActivate: [AuthGuard], data: { roles: ['fleet_manager', 'safety_officer'] } },
      { path: 'trips',       component: TripsComponent,        canActivate: [AuthGuard], data: { roles: ['fleet_manager', 'dispatcher'] } },
      { path: 'maintenance', component: MaintenanceComponent,  canActivate: [AuthGuard], data: { roles: FM } },
      { path: 'fuel-expenses', component: FuelExpensesComponent, canActivate: [AuthGuard], data: { roles: ['fleet_manager', 'financial_analyst', 'dispatcher'] } },
      { path: 'analytics',   component: AnalyticsComponent,   canActivate: [AuthGuard], data: { roles: ['fleet_manager', 'financial_analyst'] } },
      { path: 'map',         component: FleetMapComponent,     canActivate: [AuthGuard], data: { roles: ['fleet_manager', 'dispatcher', 'safety_officer'] } },
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
