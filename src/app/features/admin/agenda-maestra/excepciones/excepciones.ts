import { Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule, AlertTriangle, Plus, Pencil, Trash2, Check, X, Loader, Search, ChevronLeft, ChevronRight } from 'lucide-angular';
import { ExcepcionAgenda } from '../../../../models/admin.model';
import { AdminService } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { NuevaExcepcionComponent } from './nueva-excepcion/nueva-excepcion';
import { EditarExcepcionComponent } from './editar-excepcion/editar-excepcion';

@Component({
  selector: 'app-excepciones',
  standalone: true,
  imports: [LucideAngularModule, NuevaExcepcionComponent, EditarExcepcionComponent],
  templateUrl: './excepciones.html',
})
export class ExcepcionesComponent {
  private readonly adminSvc = inject(AdminService);
  private readonly notifSvc = inject(NotificationService);

  readonly excepciones = input.required<ExcepcionAgenda[]>();

  readonly excepcionCreada      = output<ExcepcionAgenda>();
  readonly excepcionActualizada = output<ExcepcionAgenda>();
  readonly excepcionEliminada   = output<number>();

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

  protected readonly guardando           = signal(false);
  protected readonly showNuevaExcepcion  = signal(false);
  protected readonly showEditarExcepcion = signal(false);
  protected readonly excepcionEditando   = signal<ExcepcionAgenda | null>(null);
  protected readonly eliminandoId        = signal<number | null>(null);
  protected readonly procesandoId        = signal<number | null>(null);

  protected readonly filtroTexto        = signal('');
  protected readonly filtroFechaInicio  = signal('');
  protected readonly filtroFechaFin     = signal('');
  protected readonly paginaActual       = signal(1);

  private readonly PAGE_SIZE = 10;

  protected readonly excepcionesFiltradas = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const desde = this.filtroFechaInicio();
    const hasta = this.filtroFechaFin();
    return this.excepciones().filter(exc => {
      if (desde && exc.fecha < desde) return false;
      if (hasta && exc.fecha > hasta) return false;
      if (texto) {
        const hayMatch =
          exc.motivo.toLowerCase().includes(texto) ||
          exc.alcance.toLowerCase().includes(texto) ||
          exc.descripcionMotivo.toLowerCase().includes(texto);
        if (!hayMatch) return false;
      }
      return true;
    });
  });

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.excepcionesFiltradas().length / this.PAGE_SIZE))
  );

  protected readonly excepcionesPagina = computed(() => {
    const pag = Math.min(this.paginaActual(), this.totalPaginas());
    const start = (pag - 1) * this.PAGE_SIZE;
    return this.excepcionesFiltradas().slice(start, start + this.PAGE_SIZE);
  });

  protected readonly paginas = computed(() => {
    const total = this.totalPaginas();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const actual = this.paginaActual();
    const set = new Set([1, total]);
    for (let i = Math.max(2, actual - 1); i <= Math.min(total - 1, actual + 1); i++) set.add(i);
    return [...set].sort((a, b) => a - b);
  });

  protected readonly infoRango = computed(() => {
    const total = this.excepcionesFiltradas().length;
    if (total === 0) return '';
    const pag = Math.min(this.paginaActual(), this.totalPaginas());
    const desde = (pag - 1) * this.PAGE_SIZE + 1;
    const hasta = Math.min(pag * this.PAGE_SIZE, total);
    return `Mostrando ${desde}–${hasta} de ${total}`;
  });

  protected onFiltroTexto(value: string): void {
    this.filtroTexto.set(value);
    this.paginaActual.set(1);
  }

  protected onFiltroFechaInicio(value: string): void {
    this.filtroFechaInicio.set(value);
    this.paginaActual.set(1);
  }

  protected onFiltroFechaFin(value: string): void {
    this.filtroFechaFin.set(value);
    this.paginaActual.set(1);
  }

  protected irPagina(n: number): void {
    this.paginaActual.set(n);
  }

  protected onEliminar(id: number): void {
    this.eliminandoId.set(id);
  }

  protected onCancelarEliminar(): void {
    this.eliminandoId.set(null);
  }

  protected onConfirmarEliminar(id: number): void {
    this.procesandoId.set(id);
    this.adminSvc.updEstadoExcepcion(id, 'INACTIVO').subscribe({
      next: (res) => {
        this.procesandoId.set(null);
        this.eliminandoId.set(null);
        if (res.exitoso === 0) {
          this.notifSvc.mostrar(res.mensaje || 'Error al eliminar la excepción.', 'error');
        } else {
          this.excepcionEliminada.emit(id);
        }
      },
      error: (err: any) => {
        this.procesandoId.set(null);
        this.eliminandoId.set(null);
        const msg = err?.error?.mensaje as string | undefined;
        this.notifSvc.mostrar(msg ?? 'Error al eliminar la excepción. Intente nuevamente.', 'error');
      },
    });
  }

  protected onEditar(exc: ExcepcionAgenda): void {
    this.excepcionEditando.set(exc);
    this.showEditarExcepcion.set(true);
  }

  protected onGuardarNueva(data: Omit<ExcepcionAgenda, 'id'>): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.adminSvc.crearUpdExcepcion({
      id:                0,
      fecha:             data.fecha,
      motivo:            data.motivo,
      horaInicio:        data.tiempoInicio,
      horaFin:           data.tiempoFinal,
      descripcionMotivo: data.descripcionMotivo,
    }).subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.exitoso === 0) {
          this.notifSvc.mostrar(res.mensaje || 'Error al guardar la excepción.', 'error');
        } else if (res.exitoso === 2) {
          this.notifSvc.mostrar(res.mensaje, 'advertencia');
        } else {
          this.showNuevaExcepcion.set(false);
          this.paginaActual.set(1);
          this.excepcionCreada.emit({ ...data, id: res.idNuevo });
        }
      },
      error: (err: any) => {
        this.guardando.set(false);
        const msg = err?.error?.mensaje as string | undefined;
        this.notifSvc.mostrar(msg ?? 'Error al guardar la excepción. Intente nuevamente.', 'error');
      },
    });
  }

  protected onGuardarEdicion(data: ExcepcionAgenda): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.adminSvc.crearUpdExcepcion({
      id:                data.id,
      fecha:             data.fecha,
      motivo:            data.motivo,
      horaInicio:        data.tiempoInicio,
      horaFin:           data.tiempoFinal,
      descripcionMotivo: data.descripcionMotivo,
    }).subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.exitoso === 0) {
          this.notifSvc.mostrar(res.mensaje || 'Error al actualizar la excepción.', 'error');
        } else if (res.exitoso === 2) {
          this.notifSvc.mostrar(res.mensaje, 'advertencia');
        } else {
          this.showEditarExcepcion.set(false);
          this.excepcionActualizada.emit(data);
        }
      },
      error: (err: any) => {
        this.guardando.set(false);
        const msg = err?.error?.mensaje as string | undefined;
        this.notifSvc.mostrar(msg ?? 'Error al actualizar la excepción. Intente nuevamente.', 'error');
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

  protected formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha + 'T00:00:00');
    const dias  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${dias[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
  }
}
