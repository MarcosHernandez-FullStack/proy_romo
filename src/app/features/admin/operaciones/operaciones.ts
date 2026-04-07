import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Users,
  Pencil,
  XCircle,
  Calendar,
  MapPin,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { ReservaOperacion } from '../../../models/admin.model';
import { AsignarServicioComponent } from './asignar-servicio/asignar-servicio';
import { CancelarServicioComponent } from './cancelar-servicio/cancelar-servicio';
import { ReprogramarServicioComponent } from './reprogramar-servicio/reprogramar-servicio';

type FiltroTab = 'RESERVADO' | 'ASIGNADO' | 'EN_CURSO';

@Component({
  selector: 'app-operaciones',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    AsignarServicioComponent,
    CancelarServicioComponent,
    ReprogramarServicioComponent,
  ],
  templateUrl: './operaciones.html',
})
export class OperacionesComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly AlertTriangleIcon  = AlertTriangle;
  protected readonly CheckCircle2Icon   = CheckCircle2;
  protected readonly TruckIcon          = Truck;
  protected readonly UsersIcon          = Users;
  protected readonly PencilIcon         = Pencil;
  protected readonly XCircleIcon        = XCircle;
  protected readonly CalendarIcon       = Calendar;
  protected readonly MapPinIcon         = MapPin;
  protected readonly ClockIcon          = Clock;
  protected readonly SearchIcon         = Search;
  protected readonly ChevronLeftIcon    = ChevronLeft;
  protected readonly ChevronRightIcon   = ChevronRight;
  protected readonly RotateCcwIcon      = RotateCcw;

  readonly ITEMS_POR_PAGINA = 10;

  protected readonly reservas      = signal<ReservaOperacion[]>([]);
  protected readonly cargando      = signal(false);
  protected readonly filtroTab     = signal<FiltroTab>('RESERVADO');
  protected readonly busquedaId    = signal('');
  protected readonly fechaFiltro   = signal('');
  protected readonly paginaActual  = signal(1);
  protected readonly tiempoCorte   = signal<number | null>(null);

  protected readonly filtroTabs: FiltroTab[] = ['RESERVADO', 'ASIGNADO', 'EN_CURSO'];
  protected readonly tabLabel: Record<FiltroTab, string> = {
    RESERVADO: 'Reservado',
    ASIGNADO:  'Asignado',
    EN_CURSO:  'En Curso',
  };

  // Modal state
  protected readonly showAsignar        = signal(false);
  protected readonly reservaAsignar     = signal<ReservaOperacion | null>(null);
  protected readonly asignarSoloDetalle = signal(false);
  protected readonly showCancelar       = signal(false);
  protected readonly reservaCancelar    = signal<ReservaOperacion | null>(null);
  protected readonly showReprogramar    = signal(false);
  protected readonly reservaReprogramar = signal<ReservaOperacion | null>(null);

  // KPIs
  protected readonly countPendiente = computed(() => this.reservas().filter(r => r.estadoOperacion === 'RESERVADO').length);
  protected readonly countAsignado  = computed(() => this.reservas().filter(r => r.estadoOperacion === 'ASIGNADO').length);
  protected readonly countEnCurso   = computed(() => this.reservas().filter(r => r.estadoOperacion === 'EN_CURSO').length);

  // Filtrado + paginación
  protected readonly reservasFiltradas = computed(() => {
    const busq = this.busquedaId().trim();
    return this.reservas().filter(r =>
      r.estadoOperacion === this.filtroTab() &&
      (!busq || String(r.id).includes(busq))
    );
  });

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.reservasFiltradas().length / this.ITEMS_POR_PAGINA))
  );

  protected readonly reservasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA;
    return this.reservasFiltradas().slice(inicio, inicio + this.ITEMS_POR_PAGINA);
  });

  protected readonly paginas = computed(() => {
    const total  = this.totalPaginas();
    const actual = this.paginaActual();
    const inicio = Math.max(1, actual - 2);
    const fin    = Math.min(total, actual + 2);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  ngOnInit(): void {
    this.cargar();
    this.adminSvc.getParametroOperativo().subscribe({
      next: p => this.tiempoCorte.set(p.tiempoCorte),
      error: () => this.tiempoCorte.set(60), // fallback
    });
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.adminSvc.getReservas(this.fechaFiltro() || undefined).subscribe({
      next: data => { this.reservas.set(data); this.cargando.set(false); },
      error: ()   => this.cargando.set(false),
    });
  }

  protected cambiarTab(tab: FiltroTab): void {
    this.filtroTab.set(tab);
    this.paginaActual.set(1);
  }

  protected setBusqueda(v: string): void {
    this.busquedaId.set(v);
    this.paginaActual.set(1);
  }

  protected setFechaFiltro(v: string): void {
    this.fechaFiltro.set(v);
    this.paginaActual.set(1);
    this.cargar();
  }

  protected cambiarPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
  }

  protected rangoMostrado(): string {
    const total = this.reservasFiltradas().length;
    if (total === 0) return '0';
    const desde = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA + 1;
    const hasta = Math.min(this.paginaActual() * this.ITEMS_POR_PAGINA, total);
    return `${desde} - ${hasta}`;
  }

  /**
   * Determina si solo se puede ver el detalle (sin ejecutar acciones).
   * - Siempre cuando está EN_CURSO.
   * - Cuando la fecha del servicio es anterior a hoy.
   * - Cuando la fecha es hoy pero la horaInicio está a menos de TiempoCorte minutos.
   */
  protected soloDetalle(r: ReservaOperacion): boolean {
    if (r.estadoOperacion === 'EN_CURSO') return true;

    const tc = this.tiempoCorte();
    if (tc === null) return false; // aún cargando, permitir por defecto

    const fechaStr = r.fechaServicio.includes('T')
      ? r.fechaServicio.split('T')[0]
      : r.fechaServicio;

    const [y, m, d]  = fechaStr.split('-').map(Number);
    const [h, min]   = (r.horaInicio ?? '00:00').split(':').map(Number);

    const servicioDateTime = new Date(y, m - 1, d, h, min, 0, 0);
    const corteDateTime    = new Date();
    corteDateTime.setMinutes(corteDateTime.getMinutes() + tc);

    return servicioDateTime < corteDateTime;
  }

  protected abrirAsignar(r: ReservaOperacion): void {
    this.reservaAsignar.set(r);
    this.asignarSoloDetalle.set(this.soloDetalle(r));
    this.showAsignar.set(true);
  }

  protected abrirCancelar(r: ReservaOperacion): void {
    this.reservaCancelar.set(r);
    this.showCancelar.set(true);
  }

  protected abrirReprogramar(r: ReservaOperacion): void {
    this.reservaReprogramar.set(r);
    this.showReprogramar.set(true);
  }

  protected onConfirmarAsignacion(idReserva: number): void {
    this.reservas.update(prev =>
      prev.map(r => r.id === idReserva ? { ...r, estadoOperacion: 'ASIGNADO' } : r)
    );
    this.showAsignar.set(false);
  }

  protected onConfirmarCancelacion(idReserva: number): void {
    this.reservas.update(prev => prev.filter(r => r.id !== idReserva));
    this.showCancelar.set(false);
  }

  protected onConfirmarReprogramacion(idReserva: number): void {
    this.reservas.update(prev => prev.filter(r => r.id !== idReserva));
    this.showReprogramar.set(false);
    this.cargar();
  }

  protected estadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'RESERVADO':  return 'bg-[#fffbeb] text-[#bb4d00] border border-[#ffd230]';
      case 'ASIGNADO':   return 'bg-[#eff6ff] text-[#1447e6] border border-[#bedbff]';
      case 'EN_CURSO':   return 'bg-[#fff7ed] text-[#ca3500] border border-[#fdba74]';
      case 'FINALIZADO': return 'bg-[#f0fdf4] text-[#008236] border border-[#b9f8cf]';
      case 'CANCELADO':  return 'bg-[#fef2f2] text-[#c10007] border border-[#fca5a5]';
      default:           return 'bg-[#f9fafb] text-[#6a7282] border border-[#e5e7eb]';
    }
  }

  protected estadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      RESERVADO: 'Reservado', ASIGNADO: 'Asignado', EN_CURSO: 'En Curso',
      FINALIZADO: 'Finalizado', CANCELADO: 'Cancelado',
    };
    return labels[estado] ?? estado;
  }
}
