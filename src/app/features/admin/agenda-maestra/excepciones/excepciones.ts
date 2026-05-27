import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, merge, switchMap, tap } from 'rxjs';
import { LucideAngularModule, AlertTriangle, Plus, Pencil, Trash2, Check, X, Loader, Search, ChevronLeft, ChevronRight } from 'lucide-angular';
import { ExcepcionAgenda } from '../../../../models/agenda.model';
import { AgendaService } from '../../../../core/services/agenda.service';
import { NuevaExcepcionComponent } from './nueva-excepcion/nueva-excepcion';
import { EditarExcepcionComponent } from './editar-excepcion/editar-excepcion';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';
import { MensajeModalComponent } from '../../../../shared/components/mensaje-modal/mensaje-modal';

@Component({
  selector: 'app-excepciones',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, NuevaExcepcionComponent, EditarExcepcionComponent, ExitoModalComponent, MensajeModalComponent],
  templateUrl: './excepciones.html',
})
export class ExcepcionesComponent implements OnInit {
  private readonly agendaSvc  = inject(AgendaService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly PlusIcon          = Plus;
  protected readonly PencilIcon        = Pencil;
  protected readonly TrashIcon         = Trash2;
  protected readonly CheckIcon         = Check;
  protected readonly XIcon             = X;
  protected readonly LoaderIcon        = Loader;
  protected readonly SearchIcon        = Search;
  protected readonly ChevronLeftIcon   = ChevronLeft;
  protected readonly ChevronRightIcon  = ChevronRight;

  readonly ITEMS_POR_PAGINA = 10;

  protected readonly excepciones     = signal<ExcepcionAgenda[]>([]);
  protected readonly totalRegistros  = signal(0);
  protected readonly cargando        = signal(false);

  protected readonly filtroMotivo        = signal('');
  protected readonly filtroFechaInicio   = signal('');
  protected readonly filtroFechaFin      = signal('');
  protected readonly paginaActual        = signal(1);

  protected readonly guardando           = signal(false);
  protected readonly showNuevaExcepcion  = signal(false);
  protected readonly showEditarExcepcion = signal(false);
  protected readonly excepcionEditando   = signal<ExcepcionAgenda | null>(null);
  protected readonly eliminandoId        = signal<number | null>(null);
  protected readonly procesandoId        = signal<number | null>(null);
  protected readonly showExito           = signal(false);
  protected readonly tituloExito         = signal('');
  protected readonly mensajeExito        = signal('');
  protected readonly detalleExito        = signal('');
  protected readonly errorNueva          = signal<string | null>(null);
  protected readonly errorEditar         = signal<string | null>(null);
  protected readonly errorEstado         = signal<{ tipo: 'error' | 'advertencia'; titulo: string; mensaje: string } | null>(null);

  private readonly _motivoChange$ = new Subject<string>();
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

  protected readonly infoRango = computed(() => {
    const total = this.totalRegistros();
    if (total === 0) return '';
    const desde = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA + 1;
    const hasta  = Math.min(this.paginaActual() * this.ITEMS_POR_PAGINA, total);
    return `Mostrando ${desde}–${hasta} de ${total}`;
  });

  ngOnInit(): void {
    merge(
      this._motivoChange$.pipe(debounceTime(400), distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._reload$,
    ).pipe(
      switchMap(() => {
        this.cargando.set(true);
        return this.agendaSvc.getExcepciones({
          motivo:              this.filtroMotivo()       || undefined,
          fechaInicio: this.filtroFechaInicio()  || undefined,
          fechaFin:    this.filtroFechaFin()     || undefined,
          pagina:              this.paginaActual(),
          tamano:              this.ITEMS_POR_PAGINA,
        }).pipe(catchError(() => { this.cargando.set(false); return EMPTY; }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      this.excepciones.set(res.datos);
      this.totalRegistros.set(res.total);
      this.cargando.set(false);
    });

    this._reload$.next();
  }

  protected cargarExcepciones(): void {
    this._reload$.next();
  }

  protected onCerrarExito(): void {
    this.showExito.set(false);
    this.cargarExcepciones();
  }

  protected setFiltroMotivo(v: string): void {
    this.filtroMotivo.set(v);
    this._motivoChange$.next(v);
  }

  protected setFiltroFechaInicio(v: string): void {
    this.filtroFechaInicio.set(v);
    this.paginaActual.set(1);
    this.cargarExcepciones();
  }

  protected setFiltroFechaFin(v: string): void {
    this.filtroFechaFin.set(v);
    this.paginaActual.set(1);
    this.cargarExcepciones();
  }

  protected cambiarPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
    this.cargarExcepciones();
  }

  protected onEliminar(id: number): void {
    this.eliminandoId.set(id);
  }

  protected onCancelarEliminar(): void {
    this.eliminandoId.set(null);
  }

  protected onConfirmarEliminar(id: number): void {
    this.procesandoId.set(id);
    this.agendaSvc.updEstadoExcepcion(id, 'INACTIVO').subscribe({
      next: (res) => {
        this.procesandoId.set(null);
        this.eliminandoId.set(null);
        if (res.exitoso === 1) {
          this.tituloExito.set('¡Excepción Dada de Baja!');
          this.mensajeExito.set(res.mensaje);
          this.detalleExito.set(String(id));
          this.showExito.set(true);
        } else if (res.exitoso === 2) {
          this.errorEstado.set({ tipo: 'advertencia', titulo: 'Tiempo de espera agotado', mensaje: res.mensaje });
        } else {
          this.errorEstado.set({ tipo: 'error', titulo: 'Error al dar de baja', mensaje: res.mensaje });
        }
      },
      error: (err: any) => {
        this.procesandoId.set(null);
        this.eliminandoId.set(null);
        this.errorEstado.set({ tipo: 'error', titulo: 'Error al dar de baja', mensaje: err.error?.mensaje ?? 'Error al eliminar la excepción. Intente nuevamente.' });
      },
    });
  }

  protected onEditar(exc: ExcepcionAgenda): void {
    this.excepcionEditando.set(exc);
    this.showEditarExcepcion.set(true);
  }

  protected onGuardarNueva(data: Omit<ExcepcionAgenda, 'id' | 'fechaFormatLarga'>): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.agendaSvc.crearUpdExcepcion({
      id:                0,
      fecha:             data.fechaFormatCorta,
      motivo:            data.motivo,
      horaInicio:        data.tiempoInicio,
      horaFin:           data.tiempoFinal,
      descripcionMotivo: data.descripcionMotivo,
    }).subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.exitoso === 1) {
          this.errorNueva.set(null);
          this.showNuevaExcepcion.set(false);
          this.paginaActual.set(1);
          this.tituloExito.set('¡Excepción Registrada!');
          this.mensajeExito.set(res.mensaje);
          this.detalleExito.set(String(res.idNuevo));
          this.showExito.set(true);
        } else {
          this.errorNueva.set(res.mensaje);
        }
      },
      error: (err: any) => {
        this.guardando.set(false);
        this.errorNueva.set(err.error?.mensaje ?? 'Error al guardar la excepción. Intente nuevamente.');
      },
    });
  }

  protected onGuardarEdicion(data: ExcepcionAgenda): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.agendaSvc.crearUpdExcepcion({
      id:                data.id,
      fecha:             data.fechaFormatCorta,
      motivo:            data.motivo,
      horaInicio:        data.tiempoInicio,
      horaFin:           data.tiempoFinal,
      descripcionMotivo: data.descripcionMotivo,
    }).subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.exitoso === 1) {
          this.errorEditar.set(null);
          this.showEditarExcepcion.set(false);
          this.tituloExito.set('¡Excepción Actualizada!');
          this.mensajeExito.set(res.mensaje);
          this.detalleExito.set(String(data.id));
          this.showExito.set(true);
        } else {
          this.errorEditar.set(res.mensaje);
        }
      },
      error: (err: any) => {
        this.guardando.set(false);
        this.errorEditar.set(err.error?.mensaje ?? 'Error al actualizar la excepción. Intente nuevamente.');
      },
    });
  }

  protected motivoBadgeClass(motivo: string): string {
    switch (motivo) {
      case 'Feriado':
      case 'Festivo':       return 'bg-[#f3e8ff] text-[#7e22ce] border border-[#d8b4fe]';
      case 'Mantenimiento': return 'bg-[#fffbeb] text-[#bb4d00] border border-[#ffd230]';
      default:              return 'bg-[#fee2e2] text-[#c10007] border border-[#fca5a5]';
    }
  }
}
