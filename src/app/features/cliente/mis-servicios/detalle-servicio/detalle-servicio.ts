import { Component, input, output } from '@angular/core';
import { LucideAngularModule, X, CheckCircle, DollarSign } from 'lucide-angular';
import { DetalleServicio, EstadoAdminServicio, EstadoOperativo } from '../../../../models/operaciones.model';

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

  protected estadoOpClass(estado: EstadoOperativo): string {
    switch (estado) {
      case 'Finalizado': return 'text-[#008236]';
      case 'En Curso':   return 'text-[#ca3500]';
      case 'Asignado':   return 'text-[#1447e6]';
      case 'Reservado':  return 'text-[#bb4d00]';
    }
  }

  protected estadoOpDotColor(estado: EstadoOperativo): string {
    switch (estado) {
      case 'Finalizado': return '#00c950';
      case 'En Curso':   return '#ff6900';
      case 'Asignado':   return '#2b7fff';
      case 'Reservado':  return '#ffb900';
    }
  }

  protected estadoAdminClass(estado: EstadoAdminServicio): { bg: string; border: string; text: string } {
    switch (estado) {
      case 'Pagado':    return { bg: '#f0fdf4', border: '#b9f8cf', text: '#008236' };
      case 'Facturado': return { bg: '#eff6ff', border: '#bedbff', text: '#1447e6' };
      case 'Pendiente': return { bg: '#fffbeb', border: '#ffd230', text: '#bb4d00' };
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
}
