import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, AlertTriangle, X, FileText, Info } from 'lucide-angular';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner';
import { UnidadFlota } from '../../../../models/flota.model';
import { ReservaALiberar } from '../../../../models/operaciones.model';
import { FlotaService } from '../../../../core/services/flota.service';

@Component({
  selector: 'app-liberar-servicio',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ErrorBannerComponent],
  templateUrl: './liberar-servicio.html',
})
export class LiberarServicioComponent implements OnInit {
  private readonly flotaSvc = inject(FlotaService);

  readonly unidad    = input.required<UnidadFlota>();
  readonly confirmar = output<void>();
  readonly cerrar    = output<void>();

  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly XIcon             = X;
  protected readonly FileTextIcon      = FileText;
  protected readonly InfoIcon          = Info;

  cargando          = signal(false);
  guardando         = signal(false);
  errorCarga        = signal<string | null>(null);
  errorMsg          = signal<string | null>(null);
  reservas          = signal<ReservaALiberar[]>([]);
  nombreResponsable = signal('');
  kilometraje       = signal<number | null>(null);
  nota              = signal('');
  mostrarErrores    = signal(false);

  get errorNombreResponsable(): string {
    if (!this.nombreResponsable().trim()) return 'El nombre del responsable es obligatorio.';
    if (this.nombreResponsable().length > 50) return 'Máximo 50 caracteres.';
    return '';
  }

  get errorKilometraje(): string {
    const km = this.kilometraje();
    if (km === null || km === 0) return 'El kilometraje es obligatorio.';
    if (km < 1 || !Number.isInteger(km)) return 'Ingrese un valor entero mayor a 0.';
    return '';
  }

  get esValido(): boolean {
    return !this.errorNombreResponsable && !this.errorKilometraje;
  }

  onConfirmar(): void {
    this.mostrarErrores.set(true);
    if (!this.esValido || this.guardando()) return;

    this.errorMsg.set(null);
    this.guardando.set(true);

    this.flotaSvc.ingresoTaller(this.unidad().id, {
      nombreResponsable: this.nombreResponsable().trim(),
      kilometraje:       this.kilometraje()!,
      nota:              this.nota().trim(),
    }).subscribe({
      next: result => {
        this.guardando.set(false);
        if (result.exitoso === 1) {
          this.confirmar.emit();
        } else {
          this.errorMsg.set(result.mensaje || 'Error al registrar el ingreso a taller.');
        }
      },
      error: err => {
        this.guardando.set(false);
        this.errorMsg.set(err?.error?.mensaje ?? 'Error al registrar el ingreso a taller.');
      },
    });
  }

  ngOnInit(): void {
    const id = this.unidad().id;
    if (!id) return;

    this.cargando.set(true);
    this.flotaSvc.getReservasALiberar(id).subscribe({
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
