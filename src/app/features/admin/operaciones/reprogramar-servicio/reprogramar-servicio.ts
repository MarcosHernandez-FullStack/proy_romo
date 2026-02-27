import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Truck,
} from 'lucide-angular';
import { ServicioAdmin } from '../../../../models/admin.model';

interface SlotReprogramar {
  hora: string;
  estado: 'libre' | 'ocupado';
}

export interface ReprogramacionData {
  servicioId: string;
  nuevaFecha: string;
  nuevaHora: string;
}

@Component({
  selector: 'app-reprogramar-servicio',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './reprogramar-servicio.html',
})
export class ReprogramarServicioComponent {
  readonly servicio = input.required<ServicioAdmin>();
  readonly confirmar = output<ReprogramacionData>();
  readonly cerrar = output<void>();

  protected readonly CalendarIcon = Calendar;
  protected readonly CheckCircle2Icon = CheckCircle2;
  protected readonly XCircleIcon = XCircle;
  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly ClockIcon = Clock;
  protected readonly TruckIcon = Truck;

  protected readonly nuevaFecha = signal('');
  protected readonly slotSeleccionado = signal<number | null>(null);

  protected readonly slots = computed<SlotReprogramar[]>(() =>
    Array.from({ length: 24 }, (_, i) => {
      const hora = String(i).padStart(2, '0') + ':00';
      const ocupados = [10, 11, 14, 16];
      return { hora, estado: ocupados.includes(i) ? 'ocupado' : 'libre' };
    })
  );

  protected slotClass(s: SlotReprogramar, idx: number): string {
    if (this.slotSeleccionado() === idx) return 'bg-[#155dfc] border-[#155dfc] text-white cursor-pointer';
    if (s.estado === 'ocupado') return 'bg-[#1e293b] border-[#1e293b] text-white cursor-not-allowed opacity-70';
    return 'bg-white border-[#d1d5dc] text-[#364153] hover:border-[#155dfc] hover:bg-[#eff6ff] cursor-pointer';
  }

  protected onConfirmar(): void {
    if (this.slotSeleccionado() === null) return;
    this.confirmar.emit({
      servicioId: this.servicio().id,
      nuevaFecha: this.nuevaFecha() || this.servicio().fecha,
      nuevaHora: this.slots()[this.slotSeleccionado()!].hora,
    });
  }
}
