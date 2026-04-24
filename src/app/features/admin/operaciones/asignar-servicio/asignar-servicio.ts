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
} from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';
import { ReservaOperacion, Sugerencias } from '../../../../models/admin.model';
import { MensajeModalComponent } from '../../../../shared/components/mensaje-modal/mensaje-modal';

@Component({
  selector: 'app-asignar-servicio',
  standalone: true,
  imports: [LucideAngularModule, FormsModule, MensajeModalComponent],
  templateUrl: './asignar-servicio.html',
})
export class AsignarServicioComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

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

  protected readonly cargando    = signal(true);
  protected readonly guardando   = signal(false);
  protected readonly error       = signal<string | null>(null);
  protected readonly sugerencias = signal<Sugerencias | null>(null);
  protected readonly idGrua      = signal<number | null>(null);
  protected readonly idOperador  = signal<number | null>(null);

  protected readonly showGruasPanel      = signal(false);
  protected readonly showOperadoresPanel = signal(false);
  protected readonly filtroGrua      = signal('');
  protected readonly filtroOperador  = signal('');

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

  protected readonly puedeConfirmar    = computed(
    () => !this.guardando() && this.idGrua() !== null && this.idOperador() !== null
  );
  protected readonly showConfirmacion  = signal(false);

  /** Verdadero si la reserva tiene al menos un recurso asignado en BD */
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
    // En modo soloDetalle o EN_CURSO no se necesitan sugerencias
    if (this.soloDetalle()) {
      this.cargando.set(false);
      return;
    }

    this.adminSvc.getSugerencias(this.reserva().id).subscribe({
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

  protected onConfirmar(): void {
    const idGrua     = this.idGrua();
    const idOperador = this.idOperador();
    if (!idGrua || !idOperador) return;

    this.guardando.set(true);
    this.error.set(null);

    this.adminSvc.asignarServicio(this.reserva().id, idGrua, idOperador).subscribe({
      next: () => { this.guardando.set(false); this.confirmar.emit(this.reserva().id); },
      error: (err)   => {
        this.guardando.set(false);
        this.error.set(err?.error?.mensaje ?? 'No se pudo completar la asignación.');
      },
    });
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
