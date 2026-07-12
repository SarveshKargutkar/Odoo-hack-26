import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  persistent?: boolean; // never auto-dismisses if true
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  private show(message: string, type: Toast['type'], duration = 4000): void {
    const id = ++this.counter;
    const persistent = duration === 0;
    const toast: Toast = { id, message, type, persistent };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    if (!persistent) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  /** duration in ms; pass 0 for a persistent toast that never auto-dismisses */
  success(message: string, duration = 4000): void { this.show(message, 'success', duration); }
  error  (message: string, duration = 4000): void { this.show(message, 'error',   duration); }
  warning(message: string, duration = 4000): void { this.show(message, 'warning', duration); }
  info   (message: string, duration = 4000): void { this.show(message, 'info',    duration); }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }
}
