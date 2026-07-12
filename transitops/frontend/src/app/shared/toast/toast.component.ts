import { Component } from '@angular/core';
import { ToastService, Toast } from './toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent {
  toasts$ = this.toastService.toasts$;

  constructor(public toastService: ToastService) {}

  icon(type: Toast['type']): string {
    return { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }[type];
  }

  trackById(_: number, t: Toast): number { return t.id; }
}
