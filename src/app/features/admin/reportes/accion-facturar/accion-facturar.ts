import { Component, input, output } from '@angular/core';
import { LucideAngularModule, FileText, X } from 'lucide-angular';
import { ServicioReporte } from '../../../../models/admin.model';

@Component({
  selector: 'app-accion-facturar',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './accion-facturar.html',
})
export class AccionFacturarComponent {
  readonly servicio = input.required<ServicioReporte>();
  readonly confirmar = output<void>();
  readonly cerrar = output<void>();

  protected readonly FileTextIcon = FileText;
  protected readonly XIcon = X;
}
