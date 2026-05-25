import { Component, computed, input, output } from '@angular/core';
import { LucideAngularModule, X, CheckCircle, DollarSign } from 'lucide-angular';
import { DetalleServicio, TrazabilidadItem } from '../../../../models/operaciones.model';

@Component({
  selector: 'app-detalle-servicio',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './detalle-servicio.html',
})
export class DetalleServicioComponent {
  readonly detalle  = input<DetalleServicio | null>(null);
  readonly cargando = input<boolean>(false);
  readonly cerrar   = output<void>();

  protected readonly XIcon           = X;
  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly DollarSignIcon  = DollarSign;

  protected readonly trazabilidad = computed(() => {
    const d = this.detalle();
    return d ? this.buildTrazabilidad(d) : [];
  });

  protected readonly duracionHoras = computed(() => this.detalle()?.nroBloques ?? 0);

  protected fechaDisplay(): string {
    const f = this.detalle()?.fechaHoraFormateada;
    if (!f) return '';
    return f.split(' ')[0] ?? '';
  }

  protected horaDisplay(): string {
    const f = this.detalle()?.fechaHoraFormateada;
    if (!f) return '';
    return f.split(' ')[1] ?? '';
  }

  protected estadoOpLabel(estado: string): string {
    switch (estado) {
      case 'RESERVADO':  return 'Reservado';
      case 'ASIGNADO':   return 'Asignado';
      case 'ENCURSO':    return 'En Curso';
      case 'FINALIZADO': return 'Finalizado';
      case 'CANCELADO':  return 'Cancelado';
      default:           return estado;
    }
  }

  protected estadoAdminLabel(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':  return 'Pendiente';
      case 'FACTURADO':  return 'Facturado';
      case 'PAGADO':     return 'Pagado';
      default:           return estado;
    }
  }

  protected estadoOpClass(estado: string): string {
    switch (estado) {
      case 'FINALIZADO': return 'text-[#008236]';
      case 'ENCURSO':    return 'text-[#ca3500]';
      case 'ASIGNADO':   return 'text-[#1447e6]';
      case 'RESERVADO':  return 'text-[#bb4d00]';
      default:           return 'text-[#6a7282]';
    }
  }

  protected estadoOpDotColor(estado: string): string {
    switch (estado) {
      case 'FINALIZADO': return '#00c950';
      case 'ENCURSO':    return '#ff6900';
      case 'ASIGNADO':   return '#2b7fff';
      case 'RESERVADO':  return '#ffb900';
      default:           return '#9ca3af';
    }
  }

  protected estadoAdminClass(estado: string): { bg: string; border: string; text: string } {
    switch (estado) {
      case 'PAGADO':    return { bg: '#f0fdf4', border: '#b9f8cf', text: '#008236' };
      case 'FACTURADO': return { bg: '#eff6ff', border: '#bedbff', text: '#1447e6' };
      case 'PENDIENTE': return { bg: '#fffbeb', border: '#ffd230', text: '#bb4d00' };
      default:          return { bg: '#f3f4f6', border: '#e5e7eb', text: '#6a7282' };
    }
  }

  protected formatCosto(n: number): string {
    return '$' + n.toLocaleString('es-AR');
  }

  protected trazabilidadColor(color: 'green' | 'blue' | 'orange'): string {
    switch (color) {
      case 'green':  return '#00a63e';
      case 'blue':   return '#155dfc';
      case 'orange': return '#ff6900';
    }
  }

  private buildTrazabilidad(d: DetalleServicio): TrazabilidadItem[] {
    const items: TrazabilidadItem[] = [
      {
        estado:      'Pendiente',
        descripcion: 'Servicio registrado, pendiente de facturación',
        fecha: '', hora: '',
        color: 'orange',
      },
    ];
    if (d.estadoAdministrativo === 'FACTURADO' || d.estadoAdministrativo === 'PAGADO') {
      items.push({
        estado:      'Facturado',
        descripcion: 'Factura emitida al cliente',
        fecha: '', hora: '',
        color: 'blue',
      });
    }
    if (d.estadoAdministrativo === 'PAGADO') {
      items.push({
        estado:      'Pagado',
        descripcion: 'Pago confirmado',
        fecha: '', hora: '',
        color: 'green',
      });
    }
    return items;
  }
}
