import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, XCircle } from 'lucide-angular';
import { OperacionesService } from '../../../../core/services/operaciones.service';
import { ErroresCancelarServicio, ReservaOperacion } from '../../../../models/operaciones.model';
import { MensajeModalComponent } from '../../../../shared/components/mensaje-modal/mensaje-modal';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner';

@Component({
  selector: 'app-cancelar-servicio',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MensajeModalComponent, ErrorBannerComponent],
  templateUrl: './cancelar-servicio.html',
})
export class CancelarServicioComponent {
  private readonly operacionesSvc = inject(OperacionesService);

  readonly reserva   = input.required<ReservaOperacion>();
  readonly confirmar = output<number>();
  readonly cerrar    = output<void>();

  protected readonly XCircleIcon = XCircle;

  protected readonly motivo           = signal('');
  protected readonly guardando        = signal(false);
  protected readonly error            = signal<string | null>(null);
  protected readonly showConfirmacion = signal(false);
  protected readonly intentoGuardar   = signal(false);

  protected readonly errores = computed<ErroresCancelarServicio>(() => {
    const e: ErroresCancelarServicio = {};
    if (!this.intentoGuardar()) return e;
    if (!this.motivo().trim()) e.motivo = 'El motivo de cancelación es obligatorio';
    return e;
  });

  protected onGuardar(): void {
    this.intentoGuardar.set(true);
    if (Object.keys(this.errores()).length > 0) return;
    this.showConfirmacion.set(true);
  }

  protected onConfirmar(): void {
    this.guardando.set(true);
    this.error.set(null);

    this.operacionesSvc.cancelarReserva(this.reserva().id, this.motivo()).subscribe({
      next: () => { this.guardando.set(false); this.confirmar.emit(this.reserva().id); },
      error: (err)   => {
        this.guardando.set(false);
        this.error.set(err?.error?.mensaje ?? 'No se pudo cancelar el servicio.');
      },
    });
  }
}
