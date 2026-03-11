import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Phone, Truck, ChevronDown, ChevronUp } from 'lucide-angular';
import { TipoCarga } from '../tipo-carga/tipo-carga';

export interface VehiculoDetalle {
  tipo:          string;
  placa:         string;
  descripcion:   string;
  observaciones: string;
}

const vehiculoVacio = (): VehiculoDetalle =>
  ({ tipo: '', placa: '', descripcion: '', observaciones: '' });

@Component({
  selector: 'app-detalles-vehiculo',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './detalles-vehiculo.html',
})
export class DetallesVehiculoComponent {
  readonly tipoCarga         = input.required<TipoCarga>();
  readonly cantidadVehiculos = input.required<number>();
  readonly step1Complete     = input.required<boolean>();
  readonly step2Complete     = input.required<boolean>();
  readonly confirmar         = output<VehiculoDetalle[]>();

  protected readonly PhoneIcon       = Phone;
  protected readonly TruckIcon       = Truck;
  protected readonly ChevronDownIcon = ChevronDown;
  protected readonly ChevronUpIcon   = ChevronUp;

  protected readonly vehiculos   = signal<VehiculoDetalle[]>([vehiculoVacio()]);
  protected readonly expandedIdx = signal<number>(0);

  constructor() {
    // Sincronizar el array de vehículos cuando cambia cantidadVehiculos o tipoCarga
    effect(() => {
      const n = this.tipoCarga() === 'multiple' ? this.cantidadVehiculos() : 1;
      this.vehiculos.update(prev => {
        if (prev.length === n) return prev;
        if (prev.length < n) return [...prev, ...Array.from({ length: n - prev.length }, vehiculoVacio)];
        return prev.slice(0, n);
      });
      // Asegurar que el expandido sea válido
      if (this.expandedIdx() >= n) this.expandedIdx.set(0);
    }, { allowSignalWrites: true });
  }

  protected readonly puedeConfirmar = computed(() =>
    this.step1Complete() && this.step2Complete() && this.vehiculos().every(v => v.tipo !== '')
  );

  protected updateVehiculo(idx: number, field: keyof VehiculoDetalle, value: string): void {
    this.vehiculos.update(prev =>
      prev.map((v, i) => i === idx ? { ...v, [field]: value } : v)
    );
  }

  protected toggleExpand(idx: number): void {
    this.expandedIdx.set(this.expandedIdx() === idx ? -1 : idx);
  }

  protected onConfirmar(): void {
    this.confirmar.emit(this.vehiculos());
  }
}
