import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, XCircle } from 'lucide-angular';
import { OperacionesService } from '../../../../core/services/operaciones.service';
import { ReservaOperacion } from '../../../../models/operaciones.model';
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
