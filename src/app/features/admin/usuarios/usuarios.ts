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
} from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { RolUsuario, UsuarioAdmin } from '../../../models/admin.model';
import { NuevoUsuarioComponent } from './nuevo-usuario/nuevo-usuario';
import { EditarUsuarioComponent } from './editar-usuario/editar-usuario';

type FiltroEstado = 'Activos' | 'Bajas';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, NuevoUsuarioComponent, EditarUsuarioComponent],
  templateUrl: './usuarios.html',
})
export class UsuariosComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly UserCogIcon = UserCog;
  protected readonly PlusIcon = Plus;
  protected readonly SearchIcon = Search;
  protected readonly PencilIcon = Pencil;
  protected readonly RotateCcwIcon = RotateCcw;
  protected readonly Trash2Icon = Trash2;
  protected readonly ShieldIcon = Shield;
  protected readonly UsersIcon = Users;
  protected readonly MailIcon = Mail;

  protected readonly usuarios = signal<UsuarioAdmin[]>([]);
  protected readonly filtroEstado = signal<FiltroEstado>('Activos');
  protected readonly filtros: FiltroEstado[] = ['Activos', 'Bajas'];
  protected readonly busqueda = signal('');

  protected readonly showNuevo = signal(false);
  protected readonly usuarioEditar = signal<UsuarioAdmin | null>(null);

  protected readonly totalUsuarios = computed(() => this.usuarios().filter(u => u.activo).length);
  protected readonly administradores = computed(() => this.usuarios().filter(u => u.rol === 'Administrador' && u.activo).length);
  protected readonly staffOperativo = computed(() => this.usuarios().filter(u => u.rol === 'Staff' && u.activo).length);

  protected readonly usuariosFiltrados = computed(() => {
    const activos = this.filtroEstado() === 'Activos';
    const busq = this.busqueda().toLowerCase();
    return this.usuarios().filter(
      (u) =>
        u.activo === activos &&
        (!busq || u.nombre.toLowerCase().includes(busq) || u.correo.toLowerCase().includes(busq) || u.id.toLowerCase().includes(busq))
    );
  });

  ngOnInit(): void {
    this.adminSvc.getUsuarios().subscribe((data) => this.usuarios.set(data));
  }

  protected onNuevoUsuario(data: Omit<UsuarioAdmin, 'id'>): void {
    const id = `USR-${String(this.usuarios().length + 1).padStart(3, '0')}`;
    this.usuarios.update((prev) => [...prev, { ...data, id }]);
    this.showNuevo.set(false);
  }

  protected onEditarUsuario(data: UsuarioAdmin): void {
    this.usuarios.update((prev) => prev.map((u) => (u.id === data.id ? data : u)));
    this.usuarioEditar.set(null);
  }

  protected toggleActivo(id: string): void {
    this.usuarios.update((prev) => prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)));
  }

  protected rolClass(rol: RolUsuario): string {
    return rol === 'Administrador'
      ? 'bg-[#f3e8ff] text-[#6e11b0]'
      : 'bg-[#dcfce7] text-[#016630]';
  }
}
