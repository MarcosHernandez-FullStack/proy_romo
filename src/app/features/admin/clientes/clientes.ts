import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, merge, switchMap, tap } from 'rxjs';
import {
  LucideAngularModule,
  Users,
  Plus,
  Search,
  Pencil,
  RotateCcw,
  Trash2,
  Building2,
  CheckCircle,
  Ban,
  Mail,
  Phone,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-angular';
import { ClientesService } from '../../../core/services/clientes.service';
import { ClienteB2B } from '../../../models/clientes.model';
import { NuevoClienteComponent } from './nuevo-cliente/nuevo-cliente';
import { EditarClienteComponent } from './editar-cliente/editar-cliente';
import { ExitoModalComponent } from '../../../shared/components/exito-modal/exito-modal';
import { MensajeModalComponent } from '../../../shared/components/mensaje-modal/mensaje-modal';

type FiltroEstado = 'Activos' | 'Bajas';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, NuevoClienteComponent, EditarClienteComponent, ExitoModalComponent, MensajeModalComponent],
  templateUrl: './clientes.html',
})
export class ClientesComponent implements OnInit {
  private readonly clientesSvc = inject(ClientesService);
  private readonly destroyRef   = inject(DestroyRef);

  protected readonly UsersIcon        = Users;
  protected readonly PlusIcon         = Plus;
  protected readonly SearchIcon       = Search;
  protected readonly PencilIcon       = Pencil;
  protected readonly RotateCcwIcon    = RotateCcw;
  protected readonly Trash2Icon       = Trash2;
  protected readonly Building2Icon    = Building2;
  protected readonly CheckCircleIcon  = CheckCircle;
  protected readonly BanIcon          = Ban;
  protected readonly MailIcon         = Mail;
  protected readonly PhoneIcon        = Phone;
  protected readonly XIcon            = X;
  protected readonly ChevronLeftIcon  = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;
  protected readonly RefreshCwIcon    = RefreshCw;

  readonly ITEMS_POR_PAGINA = 10;

  protected readonly clientes        = signal<ClienteB2B[]>([]);
  protected readonly totalRegistros  = signal(0);
  protected readonly totalActivos    = signal(0);
  protected readonly totalInactivos  = signal(0);
  protected readonly cargando        = signal(false);

  protected readonly filtroEstado   = signal<FiltroEstado>('Activos');
  protected readonly filtroEstados: FiltroEstado[] = ['Activos', 'Bajas'];
  protected readonly busquedaId      = signal('');
  protected readonly busquedaEmpresa  = signal('');
  protected readonly busquedaContacto = signal('');
  protected readonly paginaActual    = signal(1);

  protected readonly showNuevo     = signal(false);
  protected readonly clienteEditar = signal<ClienteB2B | null>(null);
  protected readonly exitoEstado   = signal<{ titulo: string; mensaje: string; id: string } | null>(null);
  protected readonly errorEstado   = signal<{ titulo: string; mensaje: string } | null>(null);

  private readonly _idChange$       = new Subject<string>();
  private readonly _empresaChange$  = new Subject<string>();
  private readonly _contactoChange$ = new Subject<string>();
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
    !!this.busquedaId() || !!this.busquedaEmpresa() || !!this.busquedaContacto()
  );

  ngOnInit(): void {
    merge(
      this._idChange$.pipe(debounceTime(600),     distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._empresaChange$.pipe(debounceTime(400),  distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._contactoChange$.pipe(debounceTime(400), distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._reload$,
    ).pipe(
      switchMap(() => {
        this.cargando.set(true);
        const idStr = this.busquedaId().trim();
        return this.clientesSvc.getClientes({
          estado:   this.filtroEstado() === 'Activos' ? 'ACTIVO' : 'INACTIVO',
          id:       idStr ? parseInt(idStr, 10) : undefined,
          empresa:  this.busquedaEmpresa()  || undefined,
          contacto: this.busquedaContacto() || undefined,
          pagina:   this.paginaActual(),
          tamano:   this.ITEMS_POR_PAGINA,
        }).pipe(catchError(() => { this.cargando.set(false); return EMPTY; }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      this.clientes.set(res.datos);
      this.totalRegistros.set(res.total);
      this.totalActivos.set(res.totalActivos);
      this.totalInactivos.set(res.totalInactivos);
      this.cargando.set(false);
    });

    this._reload$.next();
  }

  protected cargarClientes(): void {
    this._reload$.next();
  }

  protected setBusquedaId(v: string): void {
    this.busquedaId.set(v);
    this._idChange$.next(v);
  }

  protected setBusquedaEmpresa(v: string): void {
    this.busquedaEmpresa.set(v);
    this._empresaChange$.next(v);
  }

  protected setBusquedaContacto(v: string): void {
    this.busquedaContacto.set(v);
    this._contactoChange$.next(v);
  }

  protected setFiltroEstado(f: FiltroEstado): void {
    this.filtroEstado.set(f);
    this.paginaActual.set(1);
    this._reload$.next();
  }

  protected limpiarFiltros(): void {
    this.busquedaId.set('');
    this.busquedaEmpresa.set('');
    this.busquedaContacto.set('');
    this.paginaActual.set(1);
    this.cargarClientes();
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

  protected onNuevoCliente(): void {
    this.showNuevo.set(false);
    this._reload$.next();
  }

  protected onEditarCliente(): void {
    this.clienteEditar.set(null);
    this._reload$.next();
  }

  protected darDeBajaCliente(id: number): void {
    this.clientesSvc.actualizarEstadoCliente(id, 'INACTIVO').subscribe({
      next: result => {
        if (result.exitoso === 1) {
          this.cargarClientes();
          this.exitoEstado.set({ titulo: '¡Cliente Dado de Baja!', mensaje: result.mensaje, id: String(id) });
        } else {
          this.errorEstado.set({ titulo: 'No se pudo actualizar el estado', mensaje: result.mensaje });
        }
      },
      error: err => this.errorEstado.set({ titulo: 'Error', mensaje: err.error?.mensaje ?? 'No se pudo conectar con el servidor. Intente nuevamente.' }),
    });
  }

  protected reactivarCliente(id: number): void {
    this.clientesSvc.actualizarEstadoCliente(id, 'ACTIVO').subscribe({
      next: result => {
        if (result.exitoso === 1) {
          this.cargarClientes();
          this.exitoEstado.set({ titulo: '¡Cliente Reactivado!', mensaje: result.mensaje, id: String(id) });
        } else {
          this.errorEstado.set({ titulo: 'No se pudo actualizar el estado', mensaje: result.mensaje });
        }
      },
      error: err => this.errorEstado.set({ titulo: 'Error', mensaje: err.error?.mensaje ?? 'No se pudo conectar con el servidor. Intente nuevamente.' }),
    });
  }
}
