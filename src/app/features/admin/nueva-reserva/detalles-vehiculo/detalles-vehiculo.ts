import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Phone } from 'lucide-angular';

@Component({
  selector: 'app-detalles-vehiculo',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './detalles-vehiculo.html',
})
export class DetallesVehiculoComponent {
  readonly tipoVehiculo = input.required<string>();
  readonly detallesVehiculo = input.required<string>();
  readonly observaciones = input.required<string>();
  readonly step1Complete = input.required<boolean>();
  readonly step2Complete = input.required<boolean>();
  readonly tipoVehiculoChange = output<string>();
  readonly detallesVehiculoChange = output<string>();
  readonly observacionesChange = output<string>();
  readonly confirmar = output<void>();

  protected readonly PhoneIcon = Phone;
}
