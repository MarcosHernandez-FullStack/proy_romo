import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, merge, switchMap, tap } from 'rxjs';
import {
  LucideAngularModule,
  UserCog,
  Plus,
  Search,
  Pencil,
  RotateCcw,
  Trash2,
  Shield,
  Users,
  Mail,
  CheckCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
} from 'lucide-angular';
import { UsuarioService } from '../../../core/services/usuario.service';
import { RolUsuario, UsuarioAdmin } from '../../../models/usuario.model';
import { NuevoUsuarioComponent } from './nuevo-usuario/nuevo-usuario';
import { EditarUsuarioComponent } from './editar-usuario/editar-usuario';
import { ExitoModalComponent } from '../../../shared/components/exito-modal/exito-modal';
import { MensajeModalComponent } from '../../../shared/components/mensaje-modal/mensaje-modal';

type FiltroEstado = 'Activos' | 'Bajas';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, NuevoUsuarioComponent, EditarUsuarioComponent, ExitoModalComponent, MensajeModalComponent],
  templateUrl: './usuarios.html',
})
export class UsuariosComponent implements OnInit {
  private readonly usuarioSvc = inject(UsuarioService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly UserCogIcon      = UserCog;
  protected readonly PlusIcon         = Plus;
  protected readonly SearchIcon       = Search;
  protected readonly PencilIcon       = Pencil;
  protected readonly RotateCcwIcon    = RotateCcw;
  protected readonly Trash2Icon       = Trash2;
  protected readonly ShieldIcon       = Shield;
  protected readonly UsersIcon        = Users;
  protected readonly MailIcon         = Mail;
  protected readonly CheckCircleIcon  = CheckCircle;
  protected readonly BanIcon          = Ban;
  protected readonly ChevronLeftIcon  = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;
  protected readonly XIcon            = X;
  protected readonly RefreshCwIcon    = RefreshCw;

  readonly ITEMS_POR_PAGINA = 10;

  protected readonly usuarios       = signal<UsuarioAdmin[]>([]);
  protected readonly totalRegistros = signal(0);
  protected readonly cargando       = signal(false);

  protected readonly filtroEstado   = signal<FiltroEstado>('Activos');
  protected readonly filtros: FiltroEstado[] = ['Activos', 'Bajas'];

  protected readonly busquedaId     = signal('');
  protected readonly busquedaNombre = signal('');
  protected readonly busquedaCorreo = signal('');
  protected readonly filtroRol      = signal('');

  protected readonly paginaActual   = signal(1);
  protected readonly showNuevo      = signal(false);
  protected readonly usuarioEditar  = signal<UsuarioAdmin | null>(null);
  protected readonly exitoEstado    = signal<{ titulo: string; mensaje: string; id: string } | null>(null);
  protected readonly errorEstado    = signal<{ titulo: string; mensaje: string } | null>(null);

  private readonly _idChange$     = new Subject<string>();
  private readonly _nombreChange$ = new Subject<string>();
  private readonly _correoChange$ = new Subject<string>();
  private readonly _reload$       = new Subject<void>();

  protected readonly totalUsuarios   = computed(() => this.totalRegistros());
  protected readonly administradores = signal(0);
  protected readonly staffOperativo  = signal(0);

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
    !!this.busquedaId() || !!this.busquedaNombre() || !!this.busquedaCorreo() || !!this.filtroRol()
  );

  ngOnInit(): void {
    merge(
      this._idChange$.pipe(debounceTime(600),     distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._nombreChange$.pipe(debounceTime(400), distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._correoChange$.pipe(debounceTime(400), distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._reload$,
    ).pipe(
      switchMap(() => {
        this.cargando.set(true);
        const idStr = this.busquedaId().trim();
        return this.usuarioSvc.getUsuarios({
          estado: this.filtroEstado() === 'Activos' ? 'ACTIVO' : 'INACTIVO',
          id:     idStr ? parseInt(idStr, 10) : undefined,
          nombre: this.busquedaNombre() || undefined,
          correo: this.busquedaCorreo() || undefined,
          rol:    this.filtroRol()      || undefined,
          pagina: this.paginaActual(),
          tamano: this.ITEMS_POR_PAGINA,
        }).pipe(catchError(() => { this.cargando.set(false); return EMPTY; }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      this.usuarios.set(res.datos);
      this.totalRegistros.set(res.total);
      this.administradores.set(res.totalAdministradores);
      this.staffOperativo.set(res.totalStaff);
      this.cargando.set(false);
    });

    this._reload$.next();
  }

  protected cargarUsuarios(): void {
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

  protected setBusquedaCorreo(v: string): void {
    this.busquedaCorreo.set(v);
    this._correoChange$.next(v);
  }

  protected setFiltroEstado(f: FiltroEstado): void {
    this.filtroEstado.set(f);
    this.paginaActual.set(1);
    this.cargarUsuarios();
  }

  protected setFiltroRol(v: string): void {
    this.filtroRol.set(v);
    this.paginaActual.set(1);
    this.cargarUsuarios();
  }

  protected limpiarFiltros(): void {
    this.busquedaId.set('');
    this.busquedaNombre.set('');
    this.busquedaCorreo.set('');
    this.filtroRol.set('');
    this.paginaActual.set(1);
    this.cargarUsuarios();
  }

  protected cambiarPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
    this.cargarUsuarios();
  }

  protected rangoMostrado(): string {
    const total = this.totalRegistros();
    if (total === 0) return '0';
    const desde = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA + 1;
    const hasta = Math.min(this.paginaActual() * this.ITEMS_POR_PAGINA, total);
    return `${desde} - ${hasta}`;
  }

  protected onNuevoUsuario(): void {
    this.showNuevo.set(false);
    this.cargarUsuarios();
  }

  protected onEditarUsuario(): void {
    this.usuarioEditar.set(null);
    this.cargarUsuarios();
  }

  protected darDeBajaUsuario(id: number): void {
    this.usuarioSvc.actualizarEstadoUsuario(id, 'INACTIVO').subscribe({
      next: result => {
        if (result.exitoso === 1) {
          this.cargarUsuarios();
          this.exitoEstado.set({ titulo: '¡Usuario Dado de Baja!', mensaje: result.mensaje, id: String(id) });
        } else {
          this.errorEstado.set({ titulo: 'No se pudo actualizar el estado', mensaje: result.mensaje });
        }
      },
      error: err => this.errorEstado.set({ titulo: 'Error', mensaje: err.error?.mensaje ?? 'No se pudo conectar con el servidor. Intente nuevamente.' }),
    });
  }

  protected reactivarUsuario(id: number): void {
    this.usuarioSvc.actualizarEstadoUsuario(id, 'ACTIVO').subscribe({
      next: result => {
        if (result.exitoso === 1) {
          this.cargarUsuarios();
          this.exitoEstado.set({ titulo: '¡Usuario Reactivado!', mensaje: result.mensaje, id: String(id) });
        } else {
          this.errorEstado.set({ titulo: 'No se pudo actualizar el estado', mensaje: result.mensaje });
        }
      },
      error: err => this.errorEstado.set({ titulo: 'Error', mensaje: err.error?.mensaje ?? 'No se pudo conectar con el servidor. Intente nuevamente.' }),
    });
  }

  protected rolClass(rol: RolUsuario): string {
    return rol === 'ADMINISTRADOR'
      ? 'bg-[#f3e8ff] text-[#6e11b0]'
      : 'bg-[#dcfce7] text-[#016630]';
  }
}
