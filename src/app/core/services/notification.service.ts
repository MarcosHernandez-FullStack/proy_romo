import { Injectable, signal } from '@angular/core';

export interface ToastNotification {
  mensaje: string;
  tipo: 'error' | 'advertencia';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly toast = signal<ToastNotification | null>(null);

  mostrar(mensaje: string, tipo: ToastNotification['tipo'] = 'error'): void {
    this.toast.set({ mensaje, tipo });
    setTimeout(() => this.toast.set(null), 6000);
  }

  cerrar(): void {
    this.toast.set(null);
  }
}
