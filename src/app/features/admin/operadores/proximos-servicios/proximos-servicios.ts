import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Operador } from '../../../../models/admin.model';

@Component({
  selector: 'app-proximos-servicios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proximos-servicios.html',
})
export class ProximosServiciosComponent {
  @Input({ required: true }) operador!: Operador;
  @Output() cerrar = new EventEmitter<void>();
}
