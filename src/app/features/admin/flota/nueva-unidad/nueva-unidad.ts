import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Truck, X } from 'lucide-angular';
import { UnidadFlota } from '../../../../models/admin.model';

@Component({
  selector: 'app-nueva-unidad',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './nueva-unidad.html',
})
export class NuevaUnidadComponent {
  readonly guardar = output<Omit<UnidadFlota, 'id'>>();
  readonly cerrar = output<void>();

  protected readonly TruckIcon = Truck;
  protected readonly XIcon = X;

  protected readonly placa = signal('');
  protected readonly anio = signal('');
  protected readonly marca = signal('');
  protected readonly modelo = signal('');
  protected readonly capacidad = signal(1);
  protected readonly vencimientoSeguro = signal('');

  protected get esValido(): boolean {
    return !!this.placa() && !!this.marca() && !!this.modelo() && !!this.anio();
  }

  protected onGuardar(): void {
    if (!this.esValido) return;
    this.guardar.emit({
      placa: this.placa(),
      marca: this.marca(),
      modelo: this.modelo(),
      anio: Number(this.anio()),
      capacidad: this.capacidad(),
      vencimientoSeguro: this.vencimientoSeguro(),
      estado: 'Operativa',
    });
  }
}
