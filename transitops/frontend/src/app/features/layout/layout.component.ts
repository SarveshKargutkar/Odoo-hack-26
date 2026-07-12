import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles?: string[];
}

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard',      icon: '⊞',   path: '/dashboard' },
    { label: 'Fleet',          icon: '🚛',  path: '/vehicles',      roles: ['fleet_manager'] },
    { label: 'Drivers',        icon: '👤',  path: '/drivers',       roles: ['fleet_manager', 'safety_officer'] },
    { label: 'Trips',          icon: '📍',  path: '/trips',         roles: ['fleet_manager', 'dispatcher'] },
    { label: 'Maintenance',    icon: '🔧',  path: '/maintenance',   roles: ['fleet_manager'] },
    { label: 'Fuel & Expenses',icon: '⛽',  path: '/fuel-expenses', roles: ['fleet_manager', 'financial_analyst', 'dispatcher'] },
    { label: 'Analytics',      icon: '📊',  path: '/analytics',     roles: ['fleet_manager', 'financial_analyst'] },
    { label: 'Fleet Map',      icon: '🗺️', path: '/map',            roles: ['fleet_manager', 'dispatcher', 'safety_officer'] },
  ];

  constructor(public auth: AuthService, private router: Router) {}

  get visibleNav(): NavItem[] {
    const role = this.auth.currentUser?.role;
    return this.navItems.filter(n => !n.roles || !role || n.roles.includes(role));
  }

  get userInitials(): string {
    const name = this.auth.currentUser?.name || '';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  get roleLabel(): string {
    const map: any = {
      fleet_manager: 'Fleet Manager',
      dispatcher: 'Dispatcher',
      safety_officer: 'Safety Officer',
      financial_analyst: 'Financial Analyst'
    };
    return map[this.auth.currentUser?.role || ''] || '';
  }

  showUserMenu = false;

  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(path + '/');
  }

  toggleUserMenu(e: Event): void { e.stopPropagation(); this.showUserMenu = !this.showUserMenu; }
  closeUserMenu(): void { this.showUserMenu = false; }
  logout(): void { this.showUserMenu = false; this.auth.logout(); }
}
