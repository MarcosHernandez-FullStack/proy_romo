import { Component, input, output } from '@angular/core';
import { LucideAngularModule, AlertTriangle, X, FileText, Info } from 'lucide-angular';
import { UnidadFlota } from '../../../../models/admin.model';
import { ServicioAdmin, EstadoServicioAdmin } from '../../../../models/admin.model';

@Component({
  selector: 'app-liberar-servicio',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './liberar-servicio.html',
})
export class LiberarServicioComponent {
  readonly unidad = input.required<UnidadFlota>();
  readonly servicios = input.required<ServicioAdmin[]>();
  readonly confirmar = output<void>();
  readonly cerrar = output<void>();

  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly XIcon = X;
  protected readonly FileTextIcon = FileText;
  protected readonly InfoIcon = Info;

  protected estadoBadgeClass(estado: EstadoServicioAdmin): string {
    switch (estado) {
      case 'Reservado':  return 'border-[#fcd34d] text-[#b45309] bg-[#fffbeb]';
      case 'En Curso':   return 'border-[#93c5fd] text-[#1d4ed8] bg-[#eff6ff]';
      case 'Asignado':   return 'border-[#86efac] text-[#166534] bg-[#f0fdf4]';
      case 'Finalizado': return 'border-[#d1d5dc] text-[#4a5565] bg-[#f9fafb]';
      case 'Cancelado':  return 'border-[#fca5a5] text-[#c10007] bg-[#fef2f2]';
      default:           return 'border-[#d1d5dc] text-[#4a5565] bg-[#f9fafb]';
    }
  }

  protected formatFecha(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
  }
}
