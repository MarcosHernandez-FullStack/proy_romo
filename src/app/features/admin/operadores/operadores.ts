import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCog, Plus, Search, Pencil, RotateCcw, Trash2, Phone, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { DIAS_SEMANA, DiaSemana, GridDisponibilidad, HoraGrid, HORAS_GRID, Operador, TipoDisponibilidad } from '../../../models/admin.model';
import { NuevoOperadorComponent } from './nuevo-operador/nuevo-operador';
import { EditarOperadorComponent } from './editar-operador/editar-operador';
import { ProximosServiciosComponent } from './proximos-servicios/proximos-servicios';
import { GestionDisponibilidadComponent } from './gestion-disponibilidad/gestion-disponibilidad';
import { MensajeModalComponent } from '../../../shared/components/mensaje-modal/mensaje-modal';

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
    MensajeModalComponent,
  ],
  templateUrl: './operadores.html',
})
export class OperadoresComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly UserCogIcon    = UserCog;
  protected readonly PlusIcon       = Plus;
  protected readonly SearchIcon     = Search;
  protected readonly PencilIcon     = Pencil;
  protected readonly RotateCcwIcon  = RotateCcw;
  protected readonly Trash2Icon     = Trash2;
  protected readonly PhoneIcon      = Phone;
  protected readonly CalendarIcon   = Calendar;
  protected readonly ClockIcon      = Clock;
  protected readonly ChevronLeftIcon  = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;

  readonly ITEMS_POR_PAGINA = 10;

  protected readonly operadores    = signal<Operador[]>([]);
  protected readonly filtroEstado  = signal<FiltroEstado>('Activos');
  protected readonly filtroEstados: FiltroEstado[] = ['Activos', 'Bajas'];
  protected readonly busqueda      = signal('');
  protected readonly paginaActual  = signal(1);

  protected readonly showNuevo          = signal(false);
  protected readonly operadorEditar     = signal<Operador | null>(null);
  protected readonly operadorServicios  = signal<Operador | null>(null);
  protected readonly loadingServicios   = signal(false);
  protected readonly operadorDisponib   = signal<Operador | null>(null);

  protected readonly showConfirmEstado      = signal(false);
  protected readonly operadorEnConfirmacion = signal<Operador | null>(null);
  protected readonly loadingEstado          = signal(false);
  protected readonly modalResultado         = signal<{ tipo: 'exito' | 'error'; titulo: string; mensaje: string } | null>(null);

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

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.operadoresFiltrados().length / this.ITEMS_POR_PAGINA))
  );

  protected readonly operadoresPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA;
    return this.operadoresFiltrados().slice(inicio, inicio + this.ITEMS_POR_PAGINA);
  });

  protected readonly paginas = computed(() => {
    const total  = this.totalPaginas();
    const actual = this.paginaActual();
    const inicio = Math.max(1, actual - 2);
    const fin    = Math.min(total, actual + 2);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  ngOnInit(): void {
    this.adminSvc.getOperadores().subscribe(data => this.operadores.set(data));
  }

  protected cambiarFiltro(f: FiltroEstado): void {
    this.filtroEstado.set(f);
    this.paginaActual.set(1);
  }

  protected setBusqueda(v: string): void {
    this.busqueda.set(v);
    this.paginaActual.set(1);
  }

  protected cambiarPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
  }

  protected rangoMostrado(): string {
    const total = this.operadoresFiltrados().length;
    if (total === 0) return '0';
    const desde = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA + 1;
    const hasta  = Math.min(this.paginaActual() * this.ITEMS_POR_PAGINA, total);
    return `${desde} - ${hasta}`;
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

  protected onNuevoOperador(): void {
    this.showNuevo.set(false);
    this.adminSvc.getOperadores().subscribe(data => this.operadores.set(data));
  }

  protected onEditarOperador(): void {
    this.operadorEditar.set(null);
    this.adminSvc.getOperadores().subscribe(data => this.operadores.set(data));
  }

  protected onGuardarDisponibilidad(grid: GridDisponibilidad): void {
    const op = this.operadorDisponib();
    if (!op) return;

    // Derivar tipo de disponibilidad desde la grilla actualizada
    let totalHoras = 0;
    for (const dia of DIAS_SEMANA) {
      for (const hora of HORAS_GRID) {
        if (grid[dia]?.[hora]) totalHoras++;
      }
    }
    const diasLab: DiaSemana[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    const horasNegocio: HoraGrid[] = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
    const esCompleto =
      diasLab.every(d =>
        horasNegocio.every(h => grid[d]?.[h]) &&
        HORAS_GRID.filter(h => !horasNegocio.includes(h)).every(h => !grid[d]?.[h])
      ) &&
      !(['Sáb', 'Dom'] as DiaSemana[]).some(d => HORAS_GRID.some(h => grid[d]?.[h]));
    const tipoDisponibilidad: TipoDisponibilidad =
      esCompleto ? 'Tiempo Completo' :
      totalHoras > 0 && totalHoras <= 25 ? 'Horario Parcial' : 'Personalizado';

    this.operadores.update(prev =>
      prev.map(o => o.id === op.id ? { ...o, disponibilidad: grid, tipoDisponibilidad } : o)
    );
    this.operadorDisponib.set(null);
  }

  protected onCambiarEstado(o: Operador): void {
    this.operadorEnConfirmacion.set(o);
    this.showConfirmEstado.set(true);
  }

  protected confirmarCambioEstado(): void {
    const op = this.operadorEnConfirmacion();
    if (!op) return;

    this.showConfirmEstado.set(false);
    this.loadingEstado.set(true);

    const idNum      = parseInt(op.id.replace('OP-', ''), 10);
    const nuevoEstado = op.activo ? 'INACTIVO' : 'ACTIVO';

    this.adminSvc.actualizarEstadoOperador(idNum, nuevoEstado).subscribe({
      next: result => {
        this.loadingEstado.set(false);
        this.operadorEnConfirmacion.set(null);
        if (result.exitoso === 1) {
          this.adminSvc.getOperadores().subscribe(data => this.operadores.set(data));
          this.modalResultado.set({ tipo: 'exito', titulo: '¡Estado Actualizado!', mensaje: result.mensaje });
        } else {
          this.modalResultado.set({ tipo: 'error', titulo: 'Error al actualizar', mensaje: result.mensaje || 'No se pudo actualizar el estado del operador.' });
        }
      },
      error: err => {
        this.loadingEstado.set(false);
        this.operadorEnConfirmacion.set(null);
        const msg = err?.error?.mensaje ?? 'Error al actualizar el estado.';
        this.modalResultado.set({ tipo: 'error', titulo: 'Error al actualizar', mensaje: msg });
      },
    });
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
