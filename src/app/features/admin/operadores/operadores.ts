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
  AlertTriangle,
} from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { Operador } from '../../../models/admin.model';
import { NuevoOperadorComponent } from './nuevo-operador/nuevo-operador';
import { EditarOperadorComponent } from './editar-operador/editar-operador';

type FiltroEstado = 'Activos' | 'Bajas';

@Component({
  selector: 'app-operadores',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, NuevoOperadorComponent, EditarOperadorComponent],
  templateUrl: './operadores.html',
})
export class OperadoresComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly UserCogIcon = UserCog;
  protected readonly PlusIcon = Plus;
  protected readonly SearchIcon = Search;
  protected readonly PencilIcon = Pencil;
  protected readonly RotateCcwIcon = RotateCcw;
  protected readonly Trash2Icon = Trash2;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly operadores = signal<Operador[]>([]);
  protected readonly filtroEstado = signal<FiltroEstado>('Activos');
  protected readonly filtroEstados: FiltroEstado[] = ['Activos', 'Bajas'];
  protected readonly busqueda = signal('');

  protected readonly showNuevo = signal(false);
  protected readonly operadorEditar = signal<Operador | null>(null);

  protected readonly totalOperadores = computed(() => this.operadores().length);
  protected readonly operadoresActivos = computed(() => this.operadores().filter((o) => o.activo).length);
  protected readonly conServiciosHoy = computed(() => this.operadores().filter((o) => o.activo && o.proximoServicio).length);
  protected readonly licenciasVencidas = computed(() => {
    const hoy = Date.now();
    return this.operadores().filter((o) => {
      if (!o.vencimientoLicencia) return false;
      return new Date(o.vencimientoLicencia).getTime() < hoy;
    }).length;
  });

  protected readonly operadoresFiltrados = computed(() => {
    const activos = this.filtroEstado() === 'Activos';
    const busq = this.busqueda().toLowerCase();
    return this.operadores().filter((o) =>
      o.activo === activos &&
      (!busq || o.nombre.toLowerCase().includes(busq) || o.id.toLowerCase().includes(busq))
    );
  });

  ngOnInit(): void {
    this.adminSvc.getOperadores().subscribe((data) => this.operadores.set(data));
  }

  protected onNuevoOperador(data: Omit<Operador, 'id'>): void {
    const id = `OP-${String(this.operadores().length + 1).padStart(3, '0')}`;
    this.operadores.update((prev) => [...prev, { ...data, id }]);
    this.showNuevo.set(false);
  }

  protected onEditarOperador(data: Operador): void {
    this.operadores.update((prev) =>
      prev.map((o) => (o.id === data.id ? data : o))
    );
    this.operadorEditar.set(null);
  }

  protected toggleActivo(id: string): void {
    this.operadores.update((prev) =>
      prev.map((o) => (o.id === id ? { ...o, activo: !o.activo } : o))
    );
  }

  protected licenciaVencida(o: Operador): boolean {
    if (!o.vencimientoLicencia) return false;
    return new Date(o.vencimientoLicencia).getTime() < Date.now();
  }

  protected formatFecha(dateStr: string): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
}
