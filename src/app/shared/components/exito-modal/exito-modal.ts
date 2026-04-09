import { Component, input, output } from '@angular/core';
import { LucideAngularModule, CircleCheck } from 'lucide-angular';

@Component({
  selector: 'app-exito-modal',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './exito-modal.html',
})
export class ExitoModalComponent {
  /** Título principal, ej: "¡Servicio Asignado!" */
  readonly titulo   = input.required<string>();
  /** Subtítulo / descripción breve */
  readonly mensaje  = input.required<string>();
  /** Etiqueta sobre el código/id destacado (opcional) */
  readonly etiqueta = input<string>('');
  /** Valor destacado, ej: número de reserva (opcional) */
  readonly detalle  = input<string>('');
  /** Texto del botón de cierre */
  readonly labelCerrar = input<string>('Cerrar');

  readonly cerrar = output<void>();

  protected readonly CircleCheckIcon = CircleCheck;
}
