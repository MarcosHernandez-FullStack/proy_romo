import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Truck, Layers } from 'lucide-angular';

export type TipoCarga = 'estandar' | 'multiple';

@Component({
  selector: 'app-tipo-carga',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './tipo-carga.html',
})
export class TipoCargaComponent {
  readonly tipoCarga = input.required<TipoCarga>();
  readonly cantidadVehiculos = input.required<number>();
  readonly tipoCargaChange = output<TipoCarga>();
  readonly cantidadVehiculosChange = output<number>();

  protected readonly TruckIcon = Truck;
  protected readonly LayersIcon = Layers;
}
