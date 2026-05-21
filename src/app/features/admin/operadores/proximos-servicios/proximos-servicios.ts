import { Component, input, output } from '@angular/core';
import { Operador } from '../../../../models/operadores.model';

@Component({
  selector: 'app-proximos-servicios',
  standalone: true,
  imports: [],
  templateUrl: './proximos-servicios.html',
})
export class ProximosServiciosComponent {
  readonly operador = input.required<Operador>();
  readonly cerrar   = output<void>();
}
