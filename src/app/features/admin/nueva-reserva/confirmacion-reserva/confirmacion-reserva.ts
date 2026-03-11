import { Component, input, output } from '@angular/core';
import { LucideAngularModule, Phone, Navigation, CalendarDays, DollarSign, CheckCircle } from 'lucide-angular';

export interface VehiculoResumen {
  tipo:        string;
  placa:       string;
  descripcion: string;
}

export interface DatosReserva {
  cliente:       string;
  origen:        string;
  destino:       string;
  fechaLabel:    string;
  horaSlot:      string;
  tipoCarga:     string;
  vehiculos:     VehiculoResumen[];
  distanciaKm:   number;
  tiempoMin:     number;
  margenManiobra: number;
  bloques:       number;
  costoTotal:    number;
  tarifaKm:      number;
}

@Component({
  selector: 'app-confirmacion-reserva',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './confirmacion-reserva.html',
})
export class ConfirmacionReservaComponent {
  readonly datos = input.required<DatosReserva>();
  readonly confirmar = output<void>();
  readonly cerrar = output<void>();

  protected readonly PhoneIcon = Phone;
  protected readonly NavigationIcon = Navigation;
  protected readonly CalendarDaysIcon = CalendarDays;
  protected readonly DollarSignIcon = DollarSign;
  protected readonly CheckCircleIcon = CheckCircle;
}
