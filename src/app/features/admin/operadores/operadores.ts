import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCog, Plus, Search, Pencil, RotateCcw, Trash2, Phone, Calendar, Clock } from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { GridDisponibilidad, Operador } from '../../../models/admin.model';
import { NuevoOperadorComponent } from './nuevo-operador/nuevo-operador';
import { EditarOperadorComponent } from './editar-operador/editar-operador';
import { ProximosServiciosComponent } from './proximos-servicios/proximos-servicios';
import { GestionDisponibilidadComponent } from './gestion-disponibilidad/gestion-disponibilidad';

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
  ],
  templateUrl: './operadores.html',
})
export class OperadoresComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly UserCogIcon  = UserCog;
  protected readonly PlusIcon     = Plus;
  protected readonly SearchIcon   = Search;
  protected readonly PencilIcon   = Pencil;
  protected readonly RotateCcwIcon = RotateCcw;
  protected readonly Trash2Icon   = Trash2;
  protected readonly PhoneIcon    = Phone;
  protected readonly CalendarIcon = Calendar;
  protected readonly ClockIcon    = Clock;

  protected readonly operadores    = signal<Operador[]>([]);
  protected readonly filtroEstado  = signal<FiltroEstado>('Activos');
  protected readonly filtroEstados: FiltroEstado[] = ['Activos', 'Bajas'];
  protected readonly busqueda      = signal('');

  protected readonly showNuevo          = signal(false);
  protected readonly operadorEditar     = signal<Operador | null>(null);
  protected readonly operadorServicios  = signal<Operador | null>(null);
  protected readonly loadingServicios   = signal(false);
  protected readonly operadorDisponib   = signal<Operador | null>(null);

  protected readonly totalOperadores  = computed(() => this.operadores().length);
  protected readonly conServiciosHoy  = computed(() =>
    this.operadores().filter(o => o.activo && o.proximoServicio).length
  );
  protected readonly conServiciosAsig = computed(() =>
    this.operadores().filter(o => o.activo && o.serviciosAsignados.length > 0).length
  );
  protected readonly licenciasVencidas = computed(() => {
    const hoy = Date.now();
    return this.operadores().filter(o => {
      if (!o.vencimientoLicencia) return false;
      return new Date(o.vencimientoLicencia).getTime() < hoy;
    }).length;
  });

  protected readonly operadoresFiltrados = computed(() => {
    const activos = this.filtroEstado() === 'Activos';
    const busq = this.busqueda().toLowerCase();
    return this.operadores().filter(o =>
      o.activo === activos &&
      (!busq || o.nombre.toLowerCase().includes(busq) || o.licencia.toLowerCase().includes(busq))
    );
  });

  ngOnInit(): void {
    this.adminSvc.getOperadores().subscribe(data => this.operadores.set(data));
  }

  protected abrirServicios(o: Operador): void {
    this.loadingServicios.set(true);
    const idNum = parseInt(o.id.replace('OP-', ''), 10);
    this.adminSvc.getServiciosOperador(idNum).subscribe({
      next: servicios => {
        this.operadorServicios.set({ ...o, serviciosAsignados: servicios });
        this.loadingServicios.set(false);
      },
      error: () => {
        this.operadorServicios.set(o);
        this.loadingServicios.set(false);
      },
    });
  }

  protected onNuevoOperador(data: Omit<Operador, 'id'>): void {
    const id = `OP-${String(this.operadores().length + 1).padStart(3, '0')}`;
    this.operadores.update(prev => [...prev, { ...data, id }]);
    this.showNuevo.set(false);
  }

  protected onEditarOperador(data: Operador): void {
    this.operadores.update(prev => prev.map(o => o.id === data.id ? data : o));
    this.operadorEditar.set(null);
  }

  protected onGuardarDisponibilidad(grid: GridDisponibilidad): void {
    const op = this.operadorDisponib();
    if (!op) return;
    this.operadores.update(prev =>
      prev.map(o => o.id === op.id ? { ...o, disponibilidad: grid } : o)
    );
    this.operadorDisponib.set(null);
  }

  protected toggleActivo(id: string): void {
    this.operadores.update(prev =>
      prev.map(o => o.id === id ? { ...o, activo: !o.activo } : o)
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

  protected serviciosExtra(o: Operador): number {
    return Math.max(0, o.serviciosAsignados.length - 1);
  }

  protected colorDisponibilidad(tipo: string): string {
    switch (tipo) {
      case 'Tiempo Completo': return 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]';
      case 'Horario Parcial': return 'bg-[#fefce8] text-[#854d0e] border-[#fde68a]';
      default:                return 'bg-[#f5f3ff] text-[#5b21b6] border-[#ddd6fe]';
    }
  }
}
