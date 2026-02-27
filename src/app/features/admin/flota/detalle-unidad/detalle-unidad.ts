import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule, LucideIconData, Truck, X, Info, BookOpen, Wrench, ArrowUpCircle, CheckCircle } from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';
import { BitacoraEntry, UnidadFlota } from '../../../../models/admin.model';

type TabDetalle = 'info' | 'bitacora';

@Component({
  selector: 'app-detalle-unidad',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './detalle-unidad.html',
})
export class DetalleUnidadComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  readonly unidad = input.required<UnidadFlota>();
  readonly cerrar = output<void>();

  protected readonly TruckIcon = Truck;
  protected readonly XIcon = X;
  protected readonly InfoIcon = Info;
  protected readonly BookOpenIcon = BookOpen;
  protected readonly WrenchIcon = Wrench;
  protected readonly ArrowUpCircleIcon = ArrowUpCircle;
  protected readonly CheckCircleIcon = CheckCircle;

  protected readonly tab = signal<TabDetalle>('info');
  protected readonly bitacora = signal<BitacoraEntry[]>([]);

  ngOnInit(): void {
    this.adminSvc.getBitacora(this.unidad().id).subscribe((data) => this.bitacora.set(data));
  }

  protected estadoClass(estado: string): string {
    switch (estado) {
      case 'Operativa': return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
      case 'En Taller': return 'bg-[#fef9c3] text-[#854d0e] border-[#fde68a]';
      case 'Baja': return 'bg-[#fef2f2] text-[#c10007] border-[#fca5a5]';
      default: return 'bg-[#f3f4f6] text-[#4a5565]';
    }
  }

  protected seguroBadge(fecha: string): 'VIGENTE' | 'POR VENCER' | 'VENCIDO' {
    if (!fecha) return 'VIGENTE';
    const now = Date.now();
    const ts = new Date(fecha).getTime();
    if (ts < now) return 'VENCIDO';
    if (ts < now + 30 * 24 * 60 * 60 * 1000) return 'POR VENCER';
    return 'VIGENTE';
  }

  protected vencimientoBoxClass(badge: string): string {
    switch (badge) {
      case 'VENCIDO': return 'bg-[#fef2f2] border-[#fca5a5]';
      case 'POR VENCER': return 'bg-[#fffbeb] border-[#fcd34d]';
      default: return 'bg-[#f0fdf4] border-[#7bf1a8]';
    }
  }

  protected vencimientoTextClass(badge: string): string {
    switch (badge) {
      case 'VENCIDO': return 'text-[#c10007]';
      case 'POR VENCER': return 'text-[#b45309]';
      default: return 'text-[#008236]';
    }
  }

  protected vencimientoBadgeClass(badge: string): string {
    switch (badge) {
      case 'VENCIDO': return 'bg-[#fef2f2] text-[#c10007] border-[#fca5a5]';
      case 'POR VENCER': return 'bg-[#fffbeb] text-[#b45309] border-[#fcd34d]';
      default: return 'bg-[#f0fdf4] text-[#008236] border-[#7bf1a8]';
    }
  }

  protected formatFechaLarga(dateStr: string): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    const date = new Date(+y, +m - 1, +d);
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  protected bitacoraNotaLabel(tipo: string): string {
    if (tipo.toLowerCase().includes('ingreso')) return 'Nota de Ingreso:';
    if (tipo.toLowerCase().includes('retorno')) return 'Nota de Retorno:';
    return 'Nota:';
  }

  protected bitacoraTipoClass(tipo: string): string {
    if (tipo.toLowerCase().includes('ingreso')) return 'bg-[#fef9c3] text-[#854d0e] border-[#fde68a]';
    if (tipo.toLowerCase().includes('retorno')) return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
    return 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]';
  }

  protected bitacoraTipoIcon(tipo: string): LucideIconData {
    if (tipo.toLowerCase().includes('ingreso')) return this.WrenchIcon;
    if (tipo.toLowerCase().includes('retorno')) return this.ArrowUpCircleIcon;
    return this.BookOpenIcon;
  }
}
