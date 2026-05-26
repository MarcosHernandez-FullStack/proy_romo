import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, merge, switchMap, tap } from 'rxjs';
import {
  LucideAngularModule,
  UserCog, Plus, Search, Pencil, RotateCcw, Trash2,
  Phone, Calendar, Clock, ChevronLeft, ChevronRight, X, RefreshCw,
} from 'lucide-angular';
import { OperadoresService } from '../../../core/services/operadores.service';
import { Operador, ServicioProximo } from '../../../models/operadores.model';
import { NuevoOperadorComponent } from './nuevo-operador/nuevo-operador';
import { EditarOperadorComponent } from './editar-operador/editar-operador';
import { ProximosServiciosComponent } from './proximos-servicios/proximos-servicios';
import { GestionDisponibilidadComponent } from './gestion-disponibilidad/gestion-disponibilidad';
import { MensajeModalComponent } from '../../../shared/components/mensaje-modal/mensaje-modal';
import { ExitoModalComponent } from '../../../shared/components/exito-modal/exito-modal';

type FiltroEstado = 'Activos' | 'Bajas';

@Component({
  selector: 'app-operadores',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    NuevoOperadorComponent,
    EditarOperadorComponent,
    ProximosServiciosComponent,
    GestionDisponibilidadComponent,
    MensajeModalComponent,
    ExitoModalComponent,
  ],
  templateUrl: './operadores.html',
})
export class OperadoresComponent implements OnInit {
  private readonly operadoresSvc = inject(OperadoresService);
  private readonly destroyRef    = inject(DestroyRef);

  protected readonly UserCogIcon      = UserCog;
  protected readonly PlusIcon         = Plus;
  protected readonly SearchIcon       = Search;
  protected readonly PencilIcon       = Pencil;
  protected readonly RotateCcwIcon    = RotateCcw;
  protected readonly Trash2Icon       = Trash2;
  protected readonly PhoneIcon        = Phone;
  protected readonly CalendarIcon     = Calendar;
  protected readonly ClockIcon        = Clock;
  protected readonly ChevronLeftIcon  = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;
  protected readonly XIcon            = X;
  protected readonly RefreshCwIcon    = RefreshCw;

  readonly ITEMS_POR_PAGINA = 10;

  protected readonly operadores         = signal<Operador[]>([]);
  protected readonly totalRegistros     = signal(0);
  protected readonly conServiciosHoy    = signal(0);
  protected readonly conServiciosAsig   = signal(0);
  protected readonly licenciasVencidas  = signal(0);
  protected readonly cargando           = signal(false);

  protected readonly filtroEstado   = signal<FiltroEstado>('Activos');
  protected readonly filtroEstados: FiltroEstado[] = ['Activos', 'Bajas'];

  protected readonly busquedaId       = signal('');
  protected readonly busquedaNombre   = signal('');
  protected readonly busquedaLicencia = signal('');
  protected readonly paginaActual     = signal(1);

  protected readonly showNuevo             = signal(false);
  protected readonly operadorEditar        = signal<Operador | null>(null);
  protected readonly operadorServicios     = signal<Operador | null>(null);
  protected readonly serviciosDelOperador  = signal<ServicioProximo[]>([]);
  protected readonly loadingServicios      = signal(false);
  protected readonly operadorDisponib      = signal<Operador | null>(null);

  protected readonly showConfirmEstado      = signal(false);
  protected readonly operadorEnConfirmacion = signal<Operador | null>(null);
  protected readonly loadingEstado          = signal(false);
  protected readonly modalResultado         = signal<{ tipo: 'error'; titulo: string; mensaje: string } | null>(null);
  protected readonly exitoEstado            = signal<{ titulo: string; id: string } | null>(null);

  private readonly _idChange$       = new Subject<string>();
  private readonly _nombreChange$   = new Subject<string>();
  private readonly _licenciaChange$ = new Subject<string>();
  private readonly _reload$         = new Subject<void>();

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
    !!this.busquedaId() || !!this.busquedaNombre() || !!this.busquedaLicencia()
  );

  ngOnInit(): void {
    merge(
      this._idChange$.pipe(debounceTime(600),       distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._nombreChange$.pipe(debounceTime(400),   distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._licenciaChange$.pipe(debounceTime(400), distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._reload$,
    ).pipe(
      switchMap(() => {
        this.cargando.set(true);
        const idStr = this.busquedaId().trim();
        return this.operadoresSvc.getOperadores({
          estado:         this.filtroEstado() === 'Activos' ? 'ACTIVO' : 'INACTIVO',
          id:             idStr ? parseInt(idStr, 10) : undefined,
          nombreCompleto: this.busquedaNombre()   || undefined,
          nroLicencia:    this.busquedaLicencia() || undefined,
          pagina:         this.paginaActual(),
          tamano:         this.ITEMS_POR_PAGINA,
        }).pipe(catchError(() => { this.cargando.set(false); return EMPTY; }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      this.operadores.set(res.datos);
      this.totalRegistros.set(res.total);
      this.conServiciosHoy.set(res.conServiciosHoy);
      this.conServiciosAsig.set(res.conServiciosAsignados);
      this.licenciasVencidas.set(res.licenciasVencidas);
      this.cargando.set(false);
    });

    this._reload$.next();
  }

  protected cargarOperadores(): void {
    this._reload$.next();
  }

  protected setBusquedaId(v: string): void {
    this.busquedaId.set(v);
    this._idChange$.next(v);
  }

  protected setBusquedaNombre(v: string): void {
    this.busquedaNombre.set(v);
    this._nombreChange$.next(v);
  }

  protected setBusquedaLicencia(v: string): void {
    this.busquedaLicencia.set(v);
    this._licenciaChange$.next(v);
  }

  protected setFiltroEstado(f: FiltroEstado): void {
    this.filtroEstado.set(f);
    this.paginaActual.set(1);
    this.cargarOperadores();
  }

  protected limpiarFiltros(): void {
    this.busquedaId.set('');
    this.busquedaNombre.set('');
    this.busquedaLicencia.set('');
    this.paginaActual.set(1);
    this.cargarOperadores();
  }

  protected cambiarPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
    this.cargarOperadores();
  }

  protected rangoMostrado(): string {
    const total = this.totalRegistros();
    if (total === 0) return '0';
    const desde = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA + 1;
    const hasta  = Math.min(this.paginaActual() * this.ITEMS_POR_PAGINA, total);
    return `${desde} - ${hasta}`;
  }

  protected abrirServicios(o: Operador): void {
    this.loadingServicios.set(true);
    this.operadoresSvc.getServiciosOperador(o.id).subscribe({
      next: servicios => {
        this.operadorServicios.set(o);
        this.serviciosDelOperador.set(servicios);
        this.loadingServicios.set(false);
      },
      error: () => {
        this.operadorServicios.set(o);
        this.serviciosDelOperador.set([]);
        this.loadingServicios.set(false);
      },
    });
  }

  protected onNuevoOperador(): void {
    this.showNuevo.set(false);
    this.cargarOperadores();
  }

  protected onEditarOperador(): void {
    this.operadorEditar.set(null);
    this.cargarOperadores();
  }

  protected onGuardarDisponibilidad(): void {
    this.operadorDisponib.set(null);
  }

  protected onCambiarEstado(o: Operador): void {
    this.operadorEnConfirmacion.set(o);
    this.showConfirmEstado.set(true);
  }

  protected confirmarCambioEstado(): void {
    const op = this.operadorEnConfirmacion();
    if (!op) return;

    this.showConfirmEstado.set(false);
    this.loadingEstado.set(true);

    const nuevoEstado = op.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    this.operadoresSvc.actualizarEstadoOperador(op.id, nuevoEstado).subscribe({
      next: result => {
        this.loadingEstado.set(false);
        this.operadorEnConfirmacion.set(null);
        if (result.exitoso === 1) {
          this.cargarOperadores();
          const titulo = op.estado === 'ACTIVO' ? '¡Operador Dado de Baja!' : '¡Operador Reactivado!';
          this.exitoEstado.set({ titulo, id: String(op.id) });
        } else {
          this.modalResultado.set({ tipo: 'error', titulo: 'Error al actualizar', mensaje: result.mensaje || 'No se pudo actualizar el estado del operador.' });
        }
      },
      error: err => {
        this.loadingEstado.set(false);
        this.operadorEnConfirmacion.set(null);
        const msg = err?.error?.mensaje ?? 'Error al actualizar el estado.';
        this.modalResultado.set({ tipo: 'error', titulo: 'Error al actualizar', mensaje: msg });
      },
    });
  }

  protected licenciaVencida(o: Operador): boolean {
    if (!o.fecVenLic) return false;
    return this.parseFecVenLic(o.fecVenLic) < Date.now();
  }

  protected serviciosExtra(o: Operador): number {
    return Math.max(0, o.totalServiciosAsignados - 1);
  }

  protected formatProximaFecha(fecha: string | null): string {
    if (!fecha) return '';
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const d = new Date(fecha);
    return `${d.getUTCDate()} ${meses[d.getUTCMonth()]}`;
  }

  protected formatProximaHora(hora: string | null): string {
    return (hora ?? '').substring(0, 5);
  }

  protected tipoDisponibilidadLabel(totalHoras: number): string {
    if (totalHoras >= 40) return 'Tiempo Completo';
    if (totalHoras > 0)  return 'Horario Parcial';
    return 'Personalizado';
  }

  protected colorDisponibilidad(label: string): string {
    switch (label) {
      case 'Tiempo Completo': return 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]';
      case 'Horario Parcial': return 'bg-[#fefce8] text-[#854d0e] border-[#fde68a]';
      default:                return 'bg-[#f5f3ff] text-[#5b21b6] border-[#ddd6fe]';
    }
  }

  protected tooltipDisponibilidad(label: string): string {
    switch (label) {
      case 'Tiempo Completo': return 'Lun–Vie, 08:00–17:00 exactos, sin fines de semana';
      case 'Horario Parcial': return 'Entre 1 y 25 horas semanales configuradas';
      default:                return 'Sin horario configurado o más de 25h con patrón personalizado';
    }
  }

  private parseFecVenLic(fec: string): number {
    const [y, m, d] = fec.split('-');
    return new Date(+y, +m - 1, +d).getTime();
  }
}
