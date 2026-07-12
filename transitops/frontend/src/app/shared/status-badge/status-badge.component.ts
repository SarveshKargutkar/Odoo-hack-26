import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [ngClass]="colorClass">{{ status }}</span>`
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() type: 'vehicle' | 'driver' | 'trip' | 'maintenance' = 'vehicle';

  get colorClass(): string {
    const map: any = {
      'Available': 'green',
      'On Trip': 'amber',
      'In Shop': 'red',
      'Retired': 'gray',
      'Off Duty': 'gray',
      'Suspended': 'red',
      'Draft': 'gray',
      'Dispatched': 'blue',
      'Completed': 'green',
      'Cancelled': 'red',
      'Active': 'amber',
      'Closed': 'green',
    };
    return map[this.status] || 'gray';
  }
}
