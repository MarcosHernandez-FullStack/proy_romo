import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Pencil,
  Clock,
  Truck,
  Calendar,
  MapPin,
} from 'lucide-angular';
import { ServicioAdmin, Operador } from '../../../../models/admin.model';

export interface AsignacionData {
  servicioId: string;
  operador: string;
  unidad: string;
}

@Component({
  selector: 'app-asignar-servicio',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './asignar-servicio.html',
})
export class AsignarServicioComponent {
  readonly servicio = input.required<ServicioAdmin>();
  readonly operadores = input.required<Operador[]>();
  readonly confirmar = output<AsignacionData>();
  readonly cerrar = output<void>();

  protected readonly PencilIcon = Pencil;
  protected readonly ClockIcon = Clock;
  protected readonly TruckIcon = Truck;
  protected readonly CalendarIcon = Calendar;
  protected readonly MapPinIcon = MapPin;

  protected readonly operadorSeleccionado = signal('');
  protected readonly unidadSeleccionada = signal('');

  protected onConfirmar(): void {
    if (!this.operadorSeleccionado() || !this.unidadSeleccionada()) return;
    this.confirmar.emit({
      servicioId: this.servicio().id,
      operador: this.operadorSeleccionado(),
      unidad: this.unidadSeleccionada(),
    });
  }
}
