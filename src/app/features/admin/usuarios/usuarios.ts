import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
} from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { RolUsuario, UsuarioAdmin } from '../../../models/admin.model';
import { NuevoUsuarioComponent } from './nuevo-usuario/nuevo-usuario';
import { EditarUsuarioComponent } from './editar-usuario/editar-usuario';
import { ExitoModalComponent } from '../../../shared/components/exito-modal/exito-modal';

type FiltroEstado = 'Activos' | 'Bajas';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, NuevoUsuarioComponent, EditarUsuarioComponent, ExitoModalComponent],
  templateUrl: './usuarios.html',
})
export class UsuariosComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly UserCogIcon     = UserCog;
  protected readonly PlusIcon        = Plus;
  protected readonly SearchIcon      = Search;
  protected readonly PencilIcon      = Pencil;
  protected readonly RotateCcwIcon   = RotateCcw;
  protected readonly Trash2Icon      = Trash2;
  protected readonly ShieldIcon      = Shield;
  protected readonly UsersIcon       = Users;
  protected readonly MailIcon        = Mail;
  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly BanIcon         = Ban;
  protected readonly ChevronLeftIcon = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;

  readonly ITEMS_POR_PAGINA = 10;

  protected readonly usuarios       = signal<UsuarioAdmin[]>([]);
  protected readonly filtroEstado   = signal<FiltroEstado>('Activos');
  protected readonly filtros: FiltroEstado[] = ['Activos', 'Bajas'];
  protected readonly busqueda       = signal('');
  protected readonly paginaActual   = signal(1);

  protected readonly showNuevo      = signal(false);
  protected readonly usuarioEditar  = signal<UsuarioAdmin | null>(null);
  protected readonly exitoEstado    = signal<{ titulo: string; id: string } | null>(null);

  protected readonly totalUsuarios   = computed(() => this.usuarios().filter(u => u.activo).length);
  protected readonly administradores = computed(() => this.usuarios().filter(u => u.rol === 'Administrador' && u.activo).length);
  protected readonly staffOperativo  = computed(() => this.usuarios().filter(u => u.rol === 'Staff' && u.activo).length);

  protected readonly usuariosFiltrados = computed(() => {
    const activos = this.filtroEstado() === 'Activos';
    const busq = this.busqueda().toLowerCase();
    return this.usuarios().filter(u =>
      u.activo === activos &&
      (!busq || u.nombres.toLowerCase().includes(busq) || u.apellidos.toLowerCase().includes(busq) ||
       u.correo.toLowerCase().includes(busq) || u.id.toLowerCase().includes(busq))
    );
  });

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.usuariosFiltrados().length / this.ITEMS_POR_PAGINA))
  );

  protected readonly usuariosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA;
    return this.usuariosFiltrados().slice(inicio, inicio + this.ITEMS_POR_PAGINA);
  });

  protected readonly paginas = computed(() => {
    const total  = this.totalPaginas();
    const actual = this.paginaActual();
    const inicio = Math.max(1, actual - 2);
    const fin    = Math.min(total, actual + 2);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private cargarUsuarios(): void {
    this.adminSvc.getUsuarios().subscribe(data => this.usuarios.set(data));
  }

  protected setBusqueda(v: string): void {
    this.busqueda.set(v);
    this.paginaActual.set(1);
  }

  protected setFiltroEstado(f: FiltroEstado): void {
    this.filtroEstado.set(f);
    this.paginaActual.set(1);
  }

  protected cambiarPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
  }

  protected rangoMostrado(): string {
    const total = this.usuariosFiltrados().length;
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

  protected darDeBajaUsuario(id: string): void {
    this.usuarios.update(prev => prev.map(u => u.id === id ? { ...u, activo: false } : u));
    this.exitoEstado.set({ titulo: '¡Usuario Dado de Baja!', id });
  }

  protected reactivarUsuario(id: string): void {
    this.usuarios.update(prev => prev.map(u => u.id === id ? { ...u, activo: true } : u));
    this.exitoEstado.set({ titulo: '¡Usuario Reactivado!', id });
  }

  protected rolClass(rol: RolUsuario): string {
    return rol === 'Administrador'
      ? 'bg-[#f3e8ff] text-[#6e11b0]'
      : 'bg-[#dcfce7] text-[#016630]';
  }
}
