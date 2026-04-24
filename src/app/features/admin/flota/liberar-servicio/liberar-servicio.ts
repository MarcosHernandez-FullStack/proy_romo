import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, AlertTriangle, X, FileText, Info } from 'lucide-angular';
import { UnidadFlota, ReservaALiberar } from '../../../../models/admin.model';
import { AdminService } from '../../../../core/services/admin.service';

export interface LiberarData {
  nombreResponsable: string;
  kilometraje:       number;
  nota:              string;
}

@Component({
  selector: 'app-liberar-servicio',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './liberar-servicio.html',
})
export class LiberarServicioComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  readonly unidad    = input.required<UnidadFlota>();
  readonly confirmar = output<LiberarData>();
  readonly cerrar    = output<void>();

  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly XIcon             = X;
  protected readonly FileTextIcon      = FileText;
  protected readonly InfoIcon          = Info;

  cargando           = signal(false);
  errorCarga         = signal<string | null>(null);
  reservas           = signal<ReservaALiberar[]>([]);
  nombreResponsable  = signal('');
  kilometraje        = signal<number | null>(null);
  nota               = signal('');

  get esValido(): boolean {
    const km = this.kilometraje();
    return this.nombreResponsable().trim().length > 0 && km !== null && km > 0;
  }

  onConfirmar(): void {
    if (!this.esValido) return;
    this.confirmar.emit({
      nombreResponsable: this.nombreResponsable().trim(),
      kilometraje:       this.kilometraje()!,
      nota:              this.nota().trim(),
    });
  }

  ngOnInit(): void {
    const idNumerico = parseInt(this.unidad().id.split('-')[1], 10);
    if (!idNumerico) return;

    this.cargando.set(true);
    this.adminSvc.getReservasALiberar(idNumerico).subscribe({
      next: data => {
        this.reservas.set(data);
        this.cargando.set(false);
      },
      error: err => {
        this.errorCarga.set(err?.error?.mensaje ?? 'Error al consultar los servicios asignados.');
        this.cargando.set(false);
      },
    });
  }

  protected estadoBadgeClass(estadoOperacion: string): string {
    switch (estadoOperacion) {
      case 'RESERVADO': return 'border-[#fcd34d] text-[#b45309] bg-[#fffbeb]';
      case 'ASIGNADO':  return 'border-[#fed7aa] text-[#c2410c] bg-[#fff7ed]';
      case 'EN_CURSO':  return 'border-[#93c5fd] text-[#1d4ed8] bg-[#eff6ff]';
      default:          return 'border-[#d1d5dc] text-[#4a5565] bg-[#f9fafb]';
    }
  }

  protected formatFecha(dateStr: string): string {
    if (!dateStr) return '—';
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const d = new Date(clean + 'T00:00:00');
    return d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
  }
}
