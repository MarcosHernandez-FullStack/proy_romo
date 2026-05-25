import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Search,
  Download,
  Eye,
  Car,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
} from 'lucide-angular';
import { ReservasService } from '../../../core/services/reservas.service';
import { DetalleServicio, Servicio } from '../../../models/operaciones.model';
import { DetalleServicioComponent } from './detalle-servicio/detalle-servicio';

@Component({
  selector: 'app-mis-servicios',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DetalleServicioComponent],
  templateUrl: './mis-servicios.html',
})
export class MisServiciosComponent implements OnInit {
  private readonly reservasSvc = inject(ReservasService);

  protected readonly SearchIcon       = Search;
  protected readonly DownloadIcon     = Download;
  protected readonly EyeIcon          = Eye;
  protected readonly CarIcon          = Car;
  protected readonly ChevronDownIcon  = ChevronDown;
  protected readonly ChevronUpIcon    = ChevronUp;
  protected readonly ChevronLeftIcon  = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;
  protected readonly FileTextIcon     = FileText;
  protected readonly DollarSignIcon   = DollarSign;

  protected readonly servicios    = signal<Servicio[]>([]);
  protected readonly cargando     = signal(false);
  protected readonly searchQuery  = signal('');
  protected readonly fechaDesde   = signal('');
  protected readonly fechaHasta   = signal('');

  protected readonly detalle        = signal<DetalleServicio | null>(null);
  protected readonly showDetalle    = signal(false);
  protected readonly detalleLoading = signal(false);

  readonly ITEMS_POR_PAGINA = 10;
  protected readonly paginaActual = signal(1);

  protected readonly filtroOpOpen    = signal(false);
  protected readonly filtroAdminOpen = signal(false);
  protected readonly filtroOp        = signal<Set<string>>(new Set());
  protected readonly filtroAdmin     = signal<Set<string>>(new Set());

  protected readonly estadosOp:    string[] = ['RESERVADO', 'ASIGNADO', 'ENCURSO', 'FINALIZADO'];
  protected readonly estadosAdmin: string[] = ['PENDIENTE', 'FACTURADO', 'PAGADO'];

  protected readonly filtered = computed(() => {
    const q           = this.searchQuery().toLowerCase();
    const opFilter    = this.filtroOp();
    const adminFilter = this.filtroAdmin();
    return this.servicios().filter(s => {
      const matchQ     = !q
        || String(s.id).includes(q)
        || s.direccionOrigen.toLowerCase().includes(q)
        || s.direccionDestino.toLowerCase().includes(q);
      const matchOp    = opFilter.size === 0    || opFilter.has(s.estadoOperacion);
      const matchAdmin = adminFilter.size === 0 || adminFilter.has(s.estadoAdministrativo);
      return matchQ && matchOp && matchAdmin;
    });
  });

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.ITEMS_POR_PAGINA))
  );

  protected readonly paginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA;
    return this.filtered().slice(inicio, inicio + this.ITEMS_POR_PAGINA);
  });

  protected readonly paginas = computed(() => {
    const total  = this.totalPaginas();
    const actual = this.paginaActual();
    const inicio = Math.max(1, actual - 2);
    const fin    = Math.min(total, actual + 2);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  protected readonly totalServicios = computed(() => this.servicios().length);

  protected readonly enOperacion = computed(() =>
    this.servicios().filter(s =>
      s.estadoOperacion === 'ASIGNADO' || s.estadoOperacion === 'ENCURSO'
    ).length
  );

  protected readonly montoPendiente = computed(() =>
    this.servicios()
      .filter(s => s.estadoAdministrativo === 'PENDIENTE' || s.estadoAdministrativo === 'FACTURADO')
      .reduce((sum, s) => sum + s.costo, 0)
  );

  protected readonly montoLiquidado = computed(() =>
    this.servicios()
      .filter(s => s.estadoAdministrativo === 'PAGADO')
      .reduce((sum, s) => sum + s.costo, 0)
  );

  protected readonly montoLiquidadoFiltrado = computed(() =>
    this.filtered()
      .filter(s => s.estadoAdministrativo === 'PAGADO')
      .reduce((sum, s) => sum + s.costo, 0)
  );

  protected readonly countLiquidadoFiltrado = computed(() =>
    this.filtered().filter(s => s.estadoAdministrativo === 'PAGADO').length
  );

  protected readonly montoPendienteFiltrado = computed(() =>
    this.filtered()
      .filter(s => s.estadoAdministrativo === 'PENDIENTE' || s.estadoAdministrativo === 'FACTURADO')
      .reduce((sum, s) => sum + s.costo, 0)
  );

  protected readonly countPendienteFiltrado = computed(() =>
    this.filtered().filter(s =>
      s.estadoAdministrativo === 'PENDIENTE' || s.estadoAdministrativo === 'FACTURADO'
    ).length
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.reservasSvc.getServicios(this.fechaDesde() || undefined, this.fechaHasta() || undefined).subscribe({
      next: data => { this.servicios.set(data); this.cargando.set(false); },
      error: ()   => this.cargando.set(false),
    });
  }

  protected verDetalle(id: number): void {
    this.detalleLoading.set(true);
    this.showDetalle.set(true);
    this.reservasSvc.getDetalle(id).subscribe(data => {
      this.detalle.set(data);
      this.detalleLoading.set(false);
    });
  }

  protected cerrarDetalle(): void {
    this.showDetalle.set(false);
    this.detalle.set(null);
  }

  protected setSearch(v: string): void {
    this.searchQuery.set(v);
    this.paginaActual.set(1);
  }

  protected setFechaDesde(v: string): void {
    this.fechaDesde.set(v);
    this.paginaActual.set(1);
    this.cargar();
  }

  protected setFechaHasta(v: string): void {
    this.fechaHasta.set(v);
    this.paginaActual.set(1);
    this.cargar();
  }

  protected cambiarPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
  }

  protected rangoMostrado(): string {
    const total = this.filtered().length;
    if (total === 0) return '0';
    const desde = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA + 1;
    const hasta = Math.min(this.paginaActual() * this.ITEMS_POR_PAGINA, total);
    return `${desde} - ${hasta}`;
  }

  protected vehiculosLabel(n: number): string {
    return n === 1 ? '1 Vehículo' : `${n} Vehículos`;
  }

  protected estadoOpLabel(estado: string): string {
    switch (estado) {
      case 'RESERVADO':  return 'Reservado';
      case 'ASIGNADO':   return 'Asignado';
      case 'ENCURSO':    return 'En Curso';
      case 'FINALIZADO': return 'Finalizado';
      case 'CANCELADO':  return 'Cancelado';
      default:           return estado;
    }
  }

  protected estadoAdminLabel(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':  return 'Pendiente';
      case 'FACTURADO':  return 'Facturado';
      case 'PAGADO':     return 'Pagado';
      default:           return estado;
    }
  }

  protected estadoOpClass(estado: string): string {
    switch (estado) {
      case 'FINALIZADO': return 'text-[#008236]';
      case 'ENCURSO':    return 'text-[#ca3500]';
      case 'ASIGNADO':   return 'text-[#1447e6]';
      case 'RESERVADO':  return 'text-[#bb4d00]';
      default:           return 'text-[#6a7282]';
    }
  }

  protected estadoOpDotColor(estado: string): string {
    switch (estado) {
      case 'FINALIZADO': return '#00c950';
      case 'ENCURSO':    return '#ff6900';
      case 'ASIGNADO':   return '#2b7fff';
      case 'RESERVADO':  return '#ffb900';
      default:           return '#9ca3af';
    }
  }

  protected estadoAdminClass(estado: string): { bg: string; border: string; text: string } {
    switch (estado) {
      case 'PAGADO':    return { bg: '#f0fdf4', border: '#b9f8cf', text: '#008236' };
      case 'FACTURADO': return { bg: '#eff6ff', border: '#bedbff', text: '#1447e6' };
      case 'PENDIENTE': return { bg: '#fffbeb', border: '#ffd230', text: '#bb4d00' };
      default:          return { bg: '#f3f4f6', border: '#e5e7eb', text: '#6a7282' };
    }
  }

  protected formatCosto(n: number): string {
    return '$' + n.toLocaleString('es-AR');
  }

  protected toggleFiltroOp(estado: string): void {
    this.filtroOp.update(set => {
      const next = new Set(set);
      next.has(estado) ? next.delete(estado) : next.add(estado);
      return next;
    });
    this.paginaActual.set(1);
  }

  protected toggleFiltroAdmin(estado: string): void {
    this.filtroAdmin.update(set => {
      const next = new Set(set);
      next.has(estado) ? next.delete(estado) : next.add(estado);
      return next;
    });
    this.paginaActual.set(1);
  }
}
