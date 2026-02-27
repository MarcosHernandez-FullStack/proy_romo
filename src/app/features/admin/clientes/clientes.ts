import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Users,
  Plus,
  Search,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { ClienteB2B } from '../../../models/admin.model';
import { NuevoClienteComponent } from './nuevo-cliente/nuevo-cliente';
import { EditarClienteComponent } from './editar-cliente/editar-cliente';

type FiltroEstado = 'Activos' | 'Bajas';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, NuevoClienteComponent, EditarClienteComponent],
  templateUrl: './clientes.html',
})
export class ClientesComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly UsersIcon = Users;
  protected readonly PlusIcon = Plus;
  protected readonly SearchIcon = Search;
  protected readonly PencilIcon = Pencil;
  protected readonly RotateCcwIcon = RotateCcw;
  protected readonly Trash2Icon = Trash2;

  protected readonly clientes = signal<ClienteB2B[]>([]);
  protected readonly filtroEstado = signal<FiltroEstado>('Activos');
  protected readonly filtroEstados: FiltroEstado[] = ['Activos', 'Bajas'];
  protected readonly busqueda = signal('');

  protected readonly showNuevo = signal(false);
  protected readonly clienteEditar = signal<ClienteB2B | null>(null);

  protected readonly totalClientes = computed(() => this.clientes().length);
  protected readonly clientesActivos = computed(() => this.clientes().filter((c) => c.activo).length);
  protected readonly clientesInactivos = computed(() => this.clientes().filter((c) => !c.activo).length);

  protected readonly clientesFiltrados = computed(() => {
    const activos = this.filtroEstado() === 'Activos';
    const busq = this.busqueda().toLowerCase();
    return this.clientes().filter((c) =>
      c.activo === activos &&
      (!busq || c.empresa.toLowerCase().includes(busq) || c.id.toLowerCase().includes(busq) || c.contacto.toLowerCase().includes(busq))
    );
  });

  ngOnInit(): void {
    this.adminSvc.getClientes().subscribe((data) => this.clientes.set(data));
  }

  protected onNuevoCliente(data: Omit<ClienteB2B, 'id'>): void {
    const id = `CLI-${String(this.clientes().length + 1).padStart(3, '0')}`;
    this.clientes.update((prev) => [...prev, { ...data, id }]);
    this.showNuevo.set(false);
  }

  protected onEditarCliente(data: ClienteB2B): void {
    this.clientes.update((prev) =>
      prev.map((c) => (c.id === data.id ? data : c))
    );
    this.clienteEditar.set(null);
  }

  protected toggleActivo(id: string): void {
    this.clientes.update((prev) =>
      prev.map((c) => (c.id === id ? { ...c, activo: !c.activo } : c))
    );
  }

  protected eliminar(id: string): void {
    this.clientes.update((prev) => prev.filter((c) => c.id !== id));
  }
}
