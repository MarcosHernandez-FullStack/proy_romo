import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, merge, switchMap, tap } from 'rxjs';
import {
  LucideAngularModule,
  Truck, Plus, Search, Pencil, FileText, RotateCcw, Trash2,
  AlertTriangle, CheckCircle, Wrench, Shield, Tag, ChevronLeft, ChevronRight,
  X, RefreshCw,
} from 'lucide-angular';
import { FlotaService } from '../../../core/services/flota.service';
import { GetGruasParams, UnidadFlota } from '../../../models/flota.model';
import { NuevaUnidadComponent } from './nueva-unidad/nueva-unidad';
import { EditarUnidadComponent } from './editar-unidad/editar-unidad';
import { DetalleUnidadComponent } from './detalle-unidad/detalle-unidad';
import { LiberarServicioComponent } from './liberar-servicio/liberar-servicio';
import { RetornoOperativaComponent } from './retorno-operativa/retorno-operativa';
import { ExitoModalComponent } from '../../../shared/components/exito-modal/exito-modal';
import { MensajeModalComponent } from '../../../shared/components/mensaje-modal/mensaje-modal';

type FiltroFlota = 'Activas' | 'En Taller' | 'Bajas';

@Component({
  selector: 'app-flota',
  standalone: true,
  imports: [
    FormsModule, LucideAngularModule,
    NuevaUnidadComponent, EditarUnidadComponent, DetalleUnidadComponent,
    LiberarServicioComponent, RetornoOperativaComponent, ExitoModalComponent, MensajeModalComponent,
  ],
  templateUrl: './flota.html',
})
export class FlotaComponent implements OnInit {
  private readonly flotaSvc  = inject(FlotaService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly TruckIcon        = Truck;
  protected readonly PlusIcon         = Plus;
  protected readonly SearchIcon       = Search;
  protected readonly PencilIcon       = Pencil;
  protected readonly FileTextIcon     = FileText;
  protected readonly RotateCcwIcon    = RotateCcw;
  protected readonly Trash2Icon       = Trash2;
  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly CheckCircleIcon  = CheckCircle;
  protected readonly WrenchIcon       = Wrench;
  protected readonly ShieldIcon       = Shield;
  protected readonly TagIcon          = Tag;
  protected readonly ChevronLeftIcon  = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;
  protected readonly XIcon            = X;
  protected readonly RefreshCwIcon    = RefreshCw;

  readonly ITEMS_POR_PAGINA = 10;

  protected readonly flota           = signal<UnidadFlota[]>([]);
  protected readonly totalRegistros  = signal(0);
  protected readonly operativas      = signal(0);
  protected readonly enTaller        = signal(0);
  protected readonly segurosCriticos = signal(0);
  protected readonly cargando        = signal(false);

  protected readonly filtroFlota: FiltroFlota[]       = ['Activas', 'En Taller', 'Bajas'];
  protected readonly filtroActual = signal<FiltroFlota>('Activas');

  protected readonly busquedaId     = signal('');
  protected readonly busquedaPlaca  = signal('');
  protected readonly busquedaMarca  = signal('');
  protected readonly busquedaModelo = signal('');
  protected readonly paginaActual   = signal(1);

  protected readonly showNueva      = signal(false);
  protected readonly unidadEditar   = signal<UnidadFlota | null>(null);
  protected readonly unidadDetalle  = signal<UnidadFlota | null>(null);
  protected readonly unidadLiberar  = signal<UnidadFlota | null>(null);
  protected readonly unidadRetorno  = signal<UnidadFlota | null>(null);
  protected readonly guardando    = signal(false);
  protected readonly errorEstado  = signal<{ tipo: 'error' | 'advertencia'; titulo: string; mensaje: string } | null>(null);

  protected readonly exitoBaja      = signal<string | null>(null);
  protected readonly exitoReactivar = signal<string | null>(null);
  protected readonly exitoLiberar   = signal<string | null>(null);
  protected readonly exitoRetorno   = signal<string | null>(null);

  private readonly _idChange$     = new Subject<string>();
  private readonly _placaChange$  = new Subject<string>();
  private readonly _marcaChange$  = new Subject<string>();
  private readonly _modeloChange$ = new Subject<string>();
  private readonly _reload$       = new Subject<void>();

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
    !!this.busquedaId() || !!this.busquedaPlaca() || !!this.busquedaMarca() || !!this.busquedaModelo()
  );

  ngOnInit(): void {
    merge(
      this._idChange$.pipe(debounceTime(600),     distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._placaChange$.pipe(debounceTime(400),  distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._marcaChange$.pipe(debounceTime(400),  distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._modeloChange$.pipe(debounceTime(400), distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._reload$,
    ).pipe(
      switchMap(() => {
        this.cargando.set(true);
        const idStr = this.busquedaId().trim();
        return this.flotaSvc.getGruas({
          ...this.tabParams(this.filtroActual()),
          id:     idStr ? parseInt(idStr, 10) : undefined,
          placa:  this.busquedaPlaca()  || undefined,
          marca:  this.busquedaMarca()  || undefined,
          modelo: this.busquedaModelo() || undefined,
          pagina: this.paginaActual(),
          tamano: this.ITEMS_POR_PAGINA,
        }).pipe(catchError(() => { this.cargando.set(false); return EMPTY; }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      this.flota.set(res.datos);
      this.totalRegistros.set(res.total);
      this.operativas.set(res.operativas);
      this.enTaller.set(res.enTaller);
      this.segurosCriticos.set(res.segurosCriticos);
      this.cargando.set(false);
    });

    this._reload$.next();
  }

  protected cargarFlota(): void {
    this._reload$.next();
  }

  protected setBusquedaId(v: string): void {
    this.busquedaId.set(v);
    this._idChange$.next(v);
  }

  protected setBusquedaPlaca(v: string): void {
    this.busquedaPlaca.set(v);
    this._placaChange$.next(v);
  }

  protected setBusquedaMarca(v: string): void {
    this.busquedaMarca.set(v);
    this._marcaChange$.next(v);
  }

  protected setBusquedaModelo(v: string): void {
    this.busquedaModelo.set(v);
    this._modeloChange$.next(v);
  }

  protected setFiltro(f: FiltroFlota): void {
    this.filtroActual.set(f);
    this.paginaActual.set(1);
    this.cargarFlota();
  }

  protected limpiarFiltros(): void {
    this.busquedaId.set('');
    this.busquedaPlaca.set('');
    this.busquedaMarca.set('');
    this.busquedaModelo.set('');
    this.paginaActual.set(1);
    this.cargarFlota();
  }

  protected cambiarPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
    this.cargarFlota();
  }

  protected rangoMostrado(): string {
    const total = this.totalRegistros();
    if (total === 0) return '0';
    const desde = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA + 1;
    const hasta  = Math.min(this.paginaActual() * this.ITEMS_POR_PAGINA, total);
    return `${desde} - ${hasta}`;
  }

  protected onNuevaUnidad(): void {
    this.showNueva.set(false);
    this.cargarFlota();
  }

  protected onEditarUnidad(): void {
    this.unidadEditar.set(null);
    this.cargarFlota();
  }

  protected onConfirmarLiberar(): void {
    const u = this.unidadLiberar();
    if (!u) return;
    this.unidadLiberar.set(null);
    this.cargarFlota();
    this.exitoLiberar.set(String(u.id));
  }

  protected onConfirmarRetorno(): void {
    const u = this.unidadRetorno();
    if (!u) return;
    this.unidadRetorno.set(null);
    this.cargarFlota();
    this.exitoRetorno.set(String(u.id));
  }

  protected darDeBaja(id: number): void {
    this.guardando.set(true);
    this.errorEstado.set(null);
    this.flotaSvc.actualizarEstadoGrua(id, 'INACTIVO').subscribe({
      next: result => {
        this.guardando.set(false);
        if (result.exitoso === 1) {
          this.cargarFlota();
          this.exitoBaja.set(String(id));
        } else if (result.exitoso === 2) {
          this.errorEstado.set({ tipo: 'advertencia', titulo: 'Tiempo de espera agotado', mensaje: result.mensaje });
        } else {
          this.errorEstado.set({ tipo: 'error', titulo: 'Error al Dar de Baja', mensaje: result.mensaje });
        }
      },
      error: err => {
        this.guardando.set(false);
        this.errorEstado.set({ tipo: 'error', titulo: 'Error al Dar de Baja', mensaje: err.error?.mensaje ?? 'Error inesperado. Intente nuevamente.' });
      },
    });
  }

  protected reactivar(id: number): void {
    this.flotaSvc.actualizarEstadoGrua(id, 'ACTIVO').subscribe({
      next: result => {
        if (result.exitoso === 1) {
          this.cargarFlota();
          this.exitoReactivar.set(String(id));
        } else if (result.exitoso === 2) {
          this.errorEstado.set({ tipo: 'advertencia', titulo: 'Tiempo de espera agotado', mensaje: result.mensaje });
        } else {
          this.errorEstado.set({ tipo: 'error', titulo: 'Error al Reactivar', mensaje: result.mensaje });
        }
      },
      error: err => {
        this.errorEstado.set({ tipo: 'error', titulo: 'Error al Reactivar', mensaje: err.error?.mensaje ?? 'Error inesperado. Intente nuevamente.' });
      },
    });
  }

  protected onEstadoClick(u: UnidadFlota): void {
    if (u.estado === 'INACTIVO') return;
    if (u.estadoOperacion === 'ENTALLER') {
      this.unidadRetorno.set(u);
    } else {
      this.unidadLiberar.set(u);
    }
  }

  protected estadoDisplay(u: UnidadFlota): string {
    if (u.estado === 'INACTIVO') return 'Baja';
    if (u.estadoOperacion === 'ENTALLER') return 'En Taller';
    return 'Operativa';
  }

  protected estadoClass(display: string): string {
    switch (display) {
      case 'Operativa': return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
      case 'En Taller': return 'bg-[#fef9c3] text-[#854d0e] border-[#fde68a]';
      case 'Baja':      return 'bg-[#fef2f2] text-[#c10007] border-[#fca5a5]';
      default:          return 'bg-[#f3f4f6] text-[#4a5565]';
    }
  }

  protected seguroBadge(fecVenSeg: string): 'VIGENTE' | 'POR VENCER' | 'VENCIDO' {
    if (!fecVenSeg) return 'VIGENTE';
    const [d, m, y] = fecVenSeg.split('/');
    const ts = new Date(+y, +m - 1, +d).getTime();
    const now = Date.now();
    if (ts < now) return 'VENCIDO';
    if (ts < now + 30 * 24 * 60 * 60 * 1000) return 'POR VENCER';
    return 'VIGENTE';
  }

  protected seguroBadgeClass(badge: string): string {
    switch (badge) {
      case 'VIGENTE':    return 'bg-[#f0fdf4] text-[#008236] border-[#7bf1a8]';
      case 'POR VENCER': return 'bg-[#fffbeb] text-[#b45309] border-[#fcd34d]';
      case 'VENCIDO':    return 'bg-[#fef2f2] text-[#c10007] border-[#fca5a5]';
      default:           return '';
    }
  }

  private tabParams(tab: FiltroFlota): Pick<GetGruasParams, 'estado' | 'estadoOperacion'> {
    switch (tab) {
      case 'Activas':   return { estado: 'ACTIVO',   estadoOperacion: 'OPERATIVA' };
      case 'En Taller': return { estadoOperacion: 'ENTALLER' };
      case 'Bajas':     return { estado: 'INACTIVO' };
    }
  }
}
