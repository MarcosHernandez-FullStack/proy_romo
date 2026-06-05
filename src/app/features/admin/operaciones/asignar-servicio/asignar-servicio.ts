import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Pencil,
  Clock,
  Truck,
  Calendar,
  MapPin,
  Users,
  ChevronDown,
  Search,
  Eye,
  Activity,
  FileText,
} from 'lucide-angular';
import { OperacionesService } from '../../../../core/services/operaciones.service';
import { ErroresAsignarServicio, ReservaOperacion, Sugerencias } from '../../../../models/operaciones.model';
import { MensajeModalComponent } from '../../../../shared/components/mensaje-modal/mensaje-modal';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner';

@Component({
  selector: 'app-asignar-servicio',
  standalone: true,
  imports: [LucideAngularModule, FormsModule, MensajeModalComponent, ErrorBannerComponent],
  templateUrl: './asignar-servicio.html',
})
export class AsignarServicioComponent implements OnInit {
  private readonly operacionesSvc = inject(OperacionesService);

  readonly reserva     = input.required<ReservaOperacion>();
  readonly soloDetalle = input<boolean>(false);
  readonly confirmar   = output<number>();
  readonly cerrar      = output<void>();

  protected readonly PencilIcon      = Pencil;
  protected readonly ClockIcon       = Clock;
  protected readonly TruckIcon       = Truck;
  protected readonly CalendarIcon    = Calendar;
  protected readonly MapPinIcon      = MapPin;
  protected readonly UsersIcon       = Users;
  protected readonly ChevronDownIcon = ChevronDown;
  protected readonly SearchIcon      = Search;
  protected readonly EyeIcon         = Eye;
  protected readonly ActivityIcon    = Activity;
  protected readonly FileTextIcon    = FileText;

  protected readonly cargando    = signal(true);
  protected readonly guardando   = signal(false);
  protected readonly error       = signal<string | null>(null);
  protected readonly sugerencias = signal<Sugerencias | null>(null);
  protected readonly idGrua      = signal<number | null>(null);
  protected readonly idOperador  = signal<number | null>(null);

  protected readonly showGruasPanel      = signal(false);
  protected readonly showOperadoresPanel = signal(false);
  protected readonly filtroGrua          = signal('');
  protected readonly filtroOperador      = signal('');
  protected readonly intentoGuardar      = signal(false);
  protected readonly showConfirmacion    = signal(false);

  protected readonly gruaSeleccionada = computed(() =>
    this.sugerencias()?.gruas?.find(g => g.id === this.idGrua()) ?? null
  );

  protected readonly operadorSeleccionado = computed(() =>
    this.sugerencias()?.operadores?.find(o => o.id === this.idOperador()) ?? null
  );

  protected readonly gruasFiltradas = computed(() => {
    const busq  = this.filtroGrua().toLowerCase();
    const gruas = this.sugerencias()?.gruas ?? [];
    return busq
      ? gruas.filter(g =>
          g.placa.toLowerCase().includes(busq) ||
          g.marca.toLowerCase().includes(busq)  ||
          g.modelo.toLowerCase().includes(busq))
      : gruas;
  });

  protected readonly operadoresFiltrados = computed(() => {
    const busq = this.filtroOperador().toLowerCase();
    const ops  = this.sugerencias()?.operadores ?? [];
    return busq
      ? ops.filter(o =>
          o.nombres.toLowerCase().includes(busq) ||
          o.apellidos.toLowerCase().includes(busq))
      : ops;
  });

  protected readonly errores = computed<ErroresAsignarServicio>(() => {
    const e: ErroresAsignarServicio = {};
    if (!this.intentoGuardar()) return e;
    if (this.idGrua() === null) e.idGrua = 'Debe seleccionar una grúa';
    if (this.idOperador() === null) e.idOperador = 'Debe seleccionar un operador';
    return e;
  });

  protected get tieneAsignacion(): boolean {
    const r = this.reserva();
    return !!(r.gruaAsignada || r.operadorAsignado);
  }

  protected get mensajeConfirmacion(): string {
    const g = this.gruaSeleccionada();
    const o = this.operadorSeleccionado();
    return `¿Está seguro que desea asignar estos recursos?\n\nGrúa: ${g?.placa} - ${g?.marca} ${g?.modelo}\nOperador: ${o?.nombres} ${o?.apellidos}`;
  }

  ngOnInit(): void {
    if (this.soloDetalle()) {
      this.cargando.set(false);
      return;
    }

    this.operacionesSvc.getSugerencias(this.reserva().id).subscribe({
      next: data => { this.sugerencias.set(data); this.cargando.set(false); },
      error: ()   => { this.cargando.set(false); this.error.set('No se pudieron cargar las sugerencias.'); },
    });
  }

  protected seleccionarGrua(id: number): void {
    this.idGrua.set(id);
    this.showGruasPanel.set(false);
    this.filtroGrua.set('');
  }

  protected seleccionarOperador(id: number): void {
    this.idOperador.set(id);
    this.showOperadoresPanel.set(false);
    this.filtroOperador.set('');
  }

  protected toggleGruasPanel(): void {
    this.showGruasPanel.update(v => !v);
    this.showOperadoresPanel.set(false);
  }

  protected toggleOperadoresPanel(): void {
    this.showOperadoresPanel.update(v => !v);
    this.showGruasPanel.set(false);
  }

  protected onGuardar(): void {
    this.intentoGuardar.set(true);
    if (Object.keys(this.errores()).length > 0) return;
    this.showConfirmacion.set(true);
  }

  protected onConfirmar(): void {
    const idGrua     = this.idGrua();
    const idOperador = this.idOperador();
    if (!idGrua || !idOperador) return;

    this.guardando.set(true);
    this.error.set(null);

    this.operacionesSvc.asignarServicio(this.reserva().id, idGrua, idOperador).subscribe({
      next: () => { this.guardando.set(false); this.confirmar.emit(this.reserva().id); },
      error: (err)   => {
        this.guardando.set(false);
        this.error.set(err?.error?.mensaje ?? 'No se pudo completar la asignación.');
      },
    });
  }

  protected estadoOpLabel(estado: string): string {
    const labels: Record<string, string> = {
      RESERVADO: 'Reservado', ASIGNADO: 'Asignado', ENCURSO: 'En Curso',
      FINALIZADO: 'Finalizado', CANCELADO: 'Cancelado',
    };
    return labels[estado] ?? estado;
  }

  protected estadoOpBadgeClass(estado: string): string {
    switch (estado) {
      case 'RESERVADO':  return 'bg-[#fffbeb] text-[#bb4d00] border-[#ffd230]';
      case 'ASIGNADO':   return 'bg-[#eff6ff] text-[#1447e6] border-[#bedbff]';
      case 'ENCURSO':   return 'bg-[#fff7ed] text-[#ca3500] border-[#fdba74]';
      case 'FINALIZADO': return 'bg-[#f0fdf4] text-[#008236] border-[#b9f8cf]';
      case 'CANCELADO':  return 'bg-[#fef2f2] text-[#c10007] border-[#fca5a5]';
      default:           return 'bg-[#f9fafb] text-[#6a7282] border-[#e5e7eb]';
    }
  }

  protected estadoAdminLabel(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'FACTURADO': return 'Facturado';
      case 'PAGADO':    return 'Pagado';
      default:          return estado;
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

  protected clasificacionClass(c: string): string {
    switch (c) {
      case 'CERCA': return 'bg-[#f0fdf4] text-[#008236] border border-[#b9f8cf]';
      case 'MEDIO': return 'bg-[#fffbeb] text-[#bb4d00] border border-[#ffd230]';
      case 'LEJOS': return 'bg-[#fef2f2] text-[#c10007] border border-[#fca5a5]';
      default:      return 'bg-[#f9fafb] text-[#6a7282] border border-[#e5e7eb]';
    }
  }

  protected formatFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  protected formatHora(h: string): string {
    return h?.substring(0, 5) ?? '';
  }
}
