import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeEnIn from '@angular/common/locales/en-IN';

registerLocaleData(localeEnIn);

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

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
import { StatusBadgeComponent } from './shared/status-badge/status-badge.component';
import { ToastComponent } from './shared/toast/toast.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LayoutComponent,
    DashboardComponent,
    VehiclesComponent,
    DriversComponent,
    TripsComponent,
    MaintenanceComponent,
    FuelExpensesComponent,
    AnalyticsComponent,
    FleetMapComponent,
    StatusBadgeComponent,
    ToastComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'en-IN' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
