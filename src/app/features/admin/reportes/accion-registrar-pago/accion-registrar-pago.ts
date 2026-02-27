import { Component, input, output } from '@angular/core';
import { LucideAngularModule, CreditCard, X } from 'lucide-angular';
import { ServicioReporte } from '../../../../models/admin.model';

@Component({
  selector: 'app-accion-registrar-pago',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './accion-registrar-pago.html',
})
export class AccionRegistrarPagoComponent {
  readonly servicio = input.required<ServicioReporte>();
  readonly confirmar = output<void>();
  readonly cerrar = output<void>();

  protected readonly CreditCardIcon = CreditCard;
  protected readonly XIcon = X;
}
