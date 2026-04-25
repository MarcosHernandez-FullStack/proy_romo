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
  Building2,
  CheckCircle,
  Ban,
  KeyRound,
  Mail,
  Phone,
} from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { ClienteB2B } from '../../../models/admin.model';
import { NuevoClienteComponent } from './nuevo-cliente/nuevo-cliente';
import { EditarClienteComponent } from './editar-cliente/editar-cliente';
import { ExitoModalComponent } from '../../../shared/components/exito-modal/exito-modal';

type FiltroEstado = 'Activos' | 'Bajas';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, NuevoClienteComponent, EditarClienteComponent, ExitoModalComponent],
  templateUrl: './clientes.html',
})
export class ClientesComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly UsersIcon       = Users;
  protected readonly PlusIcon        = Plus;
  protected readonly SearchIcon      = Search;
  protected readonly PencilIcon      = Pencil;
  protected readonly RotateCcwIcon   = RotateCcw;
  protected readonly Trash2Icon      = Trash2;
  protected readonly Building2Icon   = Building2;
  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly BanIcon         = Ban;
  protected readonly KeyRoundIcon    = KeyRound;
  protected readonly MailIcon        = Mail;
  protected readonly PhoneIcon       = Phone;

  protected readonly clientes = signal<ClienteB2B[]>([]);
  protected readonly filtroEstado = signal<FiltroEstado>('Activos');
  protected readonly filtroEstados: FiltroEstado[] = ['Activos', 'Bajas'];
  protected readonly busqueda = signal('');

  protected readonly showNuevo = signal(false);
  protected readonly clienteEditar = signal<ClienteB2B | null>(null);
  protected readonly exitoEstado = signal<{ titulo: string; id: string } | null>(null);

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

  protected onNuevoCliente(): void {
    this.showNuevo.set(false);
    this.adminSvc.getClientes().subscribe((data) => this.clientes.set(data));
  }

  protected onEditarCliente(): void {
    this.clienteEditar.set(null);
    this.adminSvc.getClientes().subscribe((data) => this.clientes.set(data));
  }

  protected darDeBajaCliente(id: string): void {
    this.clientes.update((prev) => prev.map((c) => (c.id === id ? { ...c, activo: false } : c)));
    this.exitoEstado.set({ titulo: '¡Cliente Dado de Baja!', id });
  }

  protected reactivarCliente(id: string): void {
    this.clientes.update((prev) => prev.map((c) => (c.id === id ? { ...c, activo: true } : c)));
    this.exitoEstado.set({ titulo: '¡Cliente Reactivado!', id });
  }
}
