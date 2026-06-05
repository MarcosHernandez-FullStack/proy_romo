import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, merge, switchMap, tap } from 'rxjs';
import {
  LucideAngularModule,
  TriangleAlert,
  CircleCheck,
  Truck,
  Users,
  Pencil,
  CircleX,
  Calendar,
  MapPin,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  X,
} from 'lucide-angular';
import { OperacionesService } from '../../../core/services/operaciones.service';
import { ConfiguracionService } from '../../../core/services/configuracion.service';
import { ReservaOperacion } from '../../../models/operaciones.model';
import { AsignarServicioComponent } from './asignar-servicio/asignar-servicio';
import { CancelarServicioComponent } from './cancelar-servicio/cancelar-servicio';
import { ReprogramarServicioComponent } from './reprogramar-servicio/reprogramar-servicio';
import { ExitoModalComponent } from '../../../shared/components/exito-modal/exito-modal';

type FiltroTab = 'TODOS' | 'RESERVADO' | 'ASIGNADO' | 'ENCURSO' | 'FINALIZADO' | 'CANCELADO';

@Component({
  selector: 'app-operaciones',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    AsignarServicioComponent,
    CancelarServicioComponent,
    ReprogramarServicioComponent,
    ExitoModalComponent,
  ],
  templateUrl: './operaciones.html',
})
export class OperacionesComponent implements OnInit {
  private readonly operacionesSvc  = inject(OperacionesService);
  private readonly configuracionSvc = inject(ConfiguracionService);
  private readonly destroyRef       = inject(DestroyRef);

  protected readonly AlertTriangleIcon  = TriangleAlert;
  protected readonly CheckCircle2Icon   = CircleCheck;
  protected readonly TruckIcon          = Truck;
  protected readonly UsersIcon          = Users;
  protected readonly PencilIcon         = Pencil;
  protected readonly XCircleIcon        = CircleX;
  protected readonly CalendarIcon       = Calendar;
  protected readonly MapPinIcon         = MapPin;
  protected readonly ClockIcon          = Clock;
  protected readonly SearchIcon         = Search;
  protected readonly ChevronLeftIcon    = ChevronLeft;
  protected readonly ChevronRightIcon   = ChevronRight;
  protected readonly RotateCcwIcon      = RotateCcw;
  protected readonly EyeIcon            = Eye;
  protected readonly XIcon              = X;

  readonly ITEMS_POR_PAGINA = 10;

  protected readonly reservas        = signal<ReservaOperacion[]>([]);
  protected readonly totalRegistros  = signal(0);
  protected readonly totalReservado  = signal(0);
  protected readonly totalAsignado   = signal(0);
  protected readonly totalEnCurso    = signal(0);
  protected readonly cargando        = signal(false);

  protected readonly filtroTab    = signal<FiltroTab>('TODOS');
  protected readonly busquedaId   = signal('');
  protected readonly fechaInicio  = signal('');
  protected readonly fechaFin     = signal('');
  protected readonly paginaActual = signal(1);
  protected readonly tiempoCorte      = signal<number | null>(null);
  protected readonly nombreCliente    = signal('');
  protected readonly nombreOperador   = signal('');
  protected readonly placaGrua        = signal('');

  protected readonly filtroTabs: FiltroTab[] = ['TODOS', 'RESERVADO', 'ASIGNADO', 'ENCURSO', 'FINALIZADO', 'CANCELADO'];
  protected readonly tabLabel: Record<FiltroTab, string> = {
    TODOS:      'Todos',
    RESERVADO:  'Reservado',
    ASIGNADO:   'Asignado',
    ENCURSO:   'En Curso',
    FINALIZADO: 'Finalizado',
    CANCELADO:  'Cancelado',
  };

  // Modal state
  protected readonly showAsignar        = signal(false);
  protected readonly reservaAsignar     = signal<ReservaOperacion | null>(null);
  protected readonly asignarSoloDetalle = signal(false);
  protected readonly showCancelar       = signal(false);
  protected readonly reservaCancelar    = signal<ReservaOperacion | null>(null);
  protected readonly showReprogramar    = signal(false);
  protected readonly reservaReprogramar = signal<ReservaOperacion | null>(null);

  // Éxito modal
  protected readonly showExito     = signal(false);
  protected readonly exitoTitulo   = signal('');
  protected readonly exitoMensaje  = signal('');
  protected readonly exitoEtiqueta = signal('');
  protected readonly exitoDetalle  = signal('');

  private readonly _idChange$         = new Subject<string>();
  private readonly _reload$           = new Subject<void>();
  private readonly _filtroTextChange$ = new Subject<void>();

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalRegistros() / this.ITEMS_POR_PAGINA))
  );

  protected readonly paginas = computed(() => {
    const total  = this.totalPaginas();
    const actual = this.paginaActual();
    const inicio = Math.max(1, actual - 2);
    const fin    = Math.min(total, actual + 2);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  protected readonly hasFiltros = computed(() =>
    !!this.busquedaId()      || !!this.fechaInicio()     || !!this.fechaFin() ||
    !!this.nombreCliente()   || !!this.nombreOperador()  || !!this.placaGrua()
  );

  ngOnInit(): void {
    merge(
      this._idChange$.pipe(debounceTime(600), distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._filtroTextChange$.pipe(debounceTime(500), tap(() => this.paginaActual.set(1))),
      this._reload$,
    ).pipe(
      switchMap(() => {
        this.cargando.set(true);
        const idStr = this.busquedaId().trim();
        const tab = this.filtroTab();
        return this.operacionesSvc.getReservas({
          estadoOperacion: tab === 'TODOS' ? undefined : tab,
          id:              idStr ? parseInt(idStr, 10) : undefined,
          fechaInicio:     this.fechaInicio()    || undefined,
          fechaFin:        this.fechaFin()       || undefined,
          nombreCliente:   this.nombreCliente()  || undefined,
          nombreOperador:  this.nombreOperador() || undefined,
          placaGrua:       this.placaGrua()      || undefined,
          pagina:          this.paginaActual(),
          tamano:          this.ITEMS_POR_PAGINA,
        }).pipe(catchError(() => { this.cargando.set(false); return EMPTY; }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      this.reservas.set(res.datos);
      this.totalRegistros.set(res.total);
      this.totalReservado.set(res.totalReservado);
      this.totalAsignado.set(res.totalAsignado);
      this.totalEnCurso.set(res.totalEnCurso);
      this.cargando.set(false);
    });

    this._reload$.next();

    this.configuracionSvc.getParametroOperativo().subscribe({
      next: p => this.tiempoCorte.set(p.tiempoCorte),
      error: () => this.tiempoCorte.set(60),
    });
  }

  protected cargar(): void {
    this._reload$.next();
  }

  protected limpiarFiltros(): void {
    this.busquedaId.set('');
    this.fechaInicio.set('');
    this.fechaFin.set('');
    this.nombreCliente.set('');
    this.nombreOperador.set('');
    this.placaGrua.set('');
    this.paginaActual.set(1);
    this._reload$.next();
  }

  protected setBusquedaId(v: string): void {
    this.busquedaId.set(v);
    this._idChange$.next(v);
  }

  protected setFechaInicio(v: string): void {
    this.fechaInicio.set(v);
    this.paginaActual.set(1);
    this._reload$.next();
  }

  protected setFechaFin(v: string): void {
    this.fechaFin.set(v);
    this.paginaActual.set(1);
    this._reload$.next();
  }

  protected setNombreCliente(v: string): void {
    this.nombreCliente.set(v);
    this._filtroTextChange$.next();
  }

  protected setNombreOperador(v: string): void {
    this.nombreOperador.set(v);
    this._filtroTextChange$.next();
  }

  protected setPlacaGrua(v: string): void {
    this.placaGrua.set(v);
    this._filtroTextChange$.next();
  }

  protected cambiarTab(tab: FiltroTab): void {
    this.filtroTab.set(tab);
    this.paginaActual.set(1);
    this._reload$.next();
  }

  protected cambiarPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
    this._reload$.next();
  }

  protected rangoMostrado(): string {
    const total = this.totalRegistros();
    if (total === 0) return '0';
    const desde = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA + 1;
    const hasta  = Math.min(this.paginaActual() * this.ITEMS_POR_PAGINA, total);
    return `${desde} - ${hasta}`;
  }

  protected soloDetalle(r: ReservaOperacion): boolean {
    if (r.estadoOperacion === 'ENCURSO')   return true;
    if (r.estadoOperacion === 'FINALIZADO') return true;
    if (r.estadoOperacion === 'CANCELADO')  return true;

    const tc = this.tiempoCorte();
    if (tc === null) return false;

    const [y, m, d] = r.fechaServicio.split('-').map(Number);
    const [h, min]  = (r.horaInicio ?? '00:00').split(':').map(Number);

    const servicioDateTime = new Date(y, m - 1, d, h, min, 0, 0);
    const corteDateTime    = new Date();
    corteDateTime.setMinutes(corteDateTime.getMinutes() + tc);

    return servicioDateTime < corteDateTime;
  }

  protected formatFecha(f: string): string {
    const [y, m, d] = f.split('-');
    return `${d}/${m}/${y}`;
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
    this.showAsignar.set(false);
    this.exitoTitulo.set('¡Servicio Asignado!');
    this.exitoMensaje.set('La grúa y el operador han sido asignados exitosamente.');
    this.exitoEtiqueta.set('Servicio');
    this.exitoDetalle.set(`#${idReserva}`);
    this.showExito.set(true);
  }

  protected onConfirmarCancelacion(idReserva: number): void {
    this.showCancelar.set(false);
    this.exitoTitulo.set('¡Servicio Cancelado!');
    this.exitoMensaje.set('La reserva ha sido cancelada exitosamente.');
    this.exitoEtiqueta.set('Servicio');
    this.exitoDetalle.set(`#${idReserva}`);
    this.showExito.set(true);
  }

  protected onConfirmarReprogramacion(idReserva: number): void {
    this.showReprogramar.set(false);
    this.exitoTitulo.set('¡Servicio Reprogramado!');
    this.exitoMensaje.set('La reserva ha sido reprogramada exitosamente.');
    this.exitoEtiqueta.set('Servicio');
    this.exitoDetalle.set(`#${idReserva}`);
    this.showExito.set(true);
  }

  protected onCerrarExito(): void {
    this.showExito.set(false);
    this._reload$.next();
  }

  protected estadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'RESERVADO':  return 'bg-[#fffbeb] text-[#bb4d00] border border-[#ffd230]';
      case 'ASIGNADO':   return 'bg-[#eff6ff] text-[#1447e6] border border-[#bedbff]';
      case 'ENCURSO':   return 'bg-[#fff7ed] text-[#ca3500] border border-[#fdba74]';
      case 'FINALIZADO': return 'bg-[#f0fdf4] text-[#008236] border border-[#b9f8cf]';
      case 'CANCELADO':  return 'bg-[#fef2f2] text-[#c10007] border border-[#fca5a5]';
      default:           return 'bg-[#f9fafb] text-[#6a7282] border border-[#e5e7eb]';
    }
  }

  protected estadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      RESERVADO: 'Reservado', ASIGNADO: 'Asignado', ENCURSO: 'En Curso',
      FINALIZADO: 'Finalizado', CANCELADO: 'Cancelado',
    };
    return labels[estado] ?? estado;
  }
}
