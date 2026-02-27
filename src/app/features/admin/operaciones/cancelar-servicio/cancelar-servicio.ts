import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, XCircle } from 'lucide-angular';
import { ServicioAdmin } from '../../../../models/admin.model';

@Component({
  selector: 'app-cancelar-servicio',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './cancelar-servicio.html',
})
export class CancelarServicioComponent {
  readonly servicio = input.required<ServicioAdmin>();
  readonly confirmar = output<string>();
  readonly cerrar = output<void>();

  protected readonly XCircleIcon = XCircle;

  protected readonly motivo = signal('');

  protected onConfirmar(): void {
    if (!this.motivo()) return;
    this.confirmar.emit(this.motivo());
  }
}
