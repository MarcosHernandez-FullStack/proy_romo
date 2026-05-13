import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  FileBarChart2,
  Download,
  Search,
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
  Building2,
  Truck,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { EstadoAdminServicio, EstadoServicioAdmin, ServicioReporte } from '../../../models/admin.model';
import { AccionFacturarComponent } from './accion-facturar/accion-facturar';
import { AccionRegistrarPagoComponent } from './accion-registrar-pago/accion-registrar-pago';
import { RevisionCancelacionComponent } from './revision-cancelacion/revision-cancelacion';

type FiltroOperativo = 'Todos' | 'Finalizado' | 'Cancelado';
type FiltroAdmin = 'Todos' | 'Pendiente' | 'Facturado' | 'Pagado';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, AccionFacturarComponent, AccionRegistrarPagoComponent, RevisionCancelacionComponent],
  templateUrl: './reportes.html',
})
export class ReportesComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly FileBarChart2Icon = FileBarChart2;
  protected readonly DownloadIcon = Download;
  protected readonly SearchIcon = Search;
  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly XCircleIcon = XCircle;
  protected readonly DollarSignIcon = DollarSign;
  protected readonly FileTextIcon = FileText;
  protected readonly Building2Icon = Building2;
  protected readonly TruckIcon = Truck;
  protected readonly CalendarIcon = Calendar;
  protected readonly ChevronDownIcon  = ChevronDown;
  protected readonly ChevronLeftIcon  = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;
  protected readonly EyeIcon          = Eye;

  readonly ITEMS_POR_PAGINA = 10;

  protected readonly servicios = signal<ServicioReporte[]>([]);
  protected readonly busqueda = signal('');
  protected readonly filtroCliente = signal('');
  protected readonly fechaDesde = signal('');
  protected readonly fechaHasta = signal('');
  protected readonly filtroOperativo = signal<FiltroOperativo>('Todos');
  protected readonly filtroAdmin = signal<FiltroAdmin>('Todos');
  protected readonly paginaActual = signal(1);

  protected readonly filtrosOperativos: FiltroOperativo[] = ['Todos', 'Finalizado', 'Cancelado'];
  protected readonly filtrosAdmin: FiltroAdmin[] = ['Todos', 'Pendiente', 'Facturado', 'Pagado'];

  protected readonly servicioFacturar    = signal<ServicioReporte | null>(null);
  protected readonly servicioPago        = signal<ServicioReporte | null>(null);
  protected readonly servicioRevision    = signal<ServicioReporte | null>(null);

  protected readonly guardandoFactura = signal(false);
  protected readonly guardandoPago    = signal(false);
  protected readonly errorAccion      = signal<string | null>(null);

  protected readonly clientesUnicos = computed(() => [...new Set(this.servicios().map((s) => s.cliente))].sort());

  protected readonly totalServicios = computed(() => this.servicios().length);
  protected readonly finalizados = computed(() => this.servicios().filter((s) => s.estado === 'Finalizado').length);
  protected readonly cancelados = computed(() => this.servicios().filter((s) => s.estado === 'Cancelado').length);
  protected readonly montoTotal = computed(() => this.servicios().filter((s) => s.estado === 'Finalizado').reduce((sum, s) => sum + s.costo, 0));

  protected readonly pendientes = computed(() => this.serviciosFiltrados().filter((s) => s.estadoAdministrativo === 'Pendiente' && s.estado === 'Finalizado').length);
  protected readonly facturados = computed(() => this.serviciosFiltrados().filter((s) => s.estadoAdministrativo === 'Facturado').length);
  protected readonly pagados = computed(() => this.serviciosFiltrados().filter((s) => s.estadoAdministrativo === 'Pagado').length);

  protected readonly serviciosFiltrados = computed(() => {
    const busq = this.busqueda().toLowerCase();
    const cliente = this.filtroCliente();
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    const opFiltro = this.filtroOperativo();
    const admFiltro = this.filtroAdmin();
    return this.servicios().filter((s) => {
      const matchBusq = !busq || s.id.toLowerCase().includes(busq) || (s.unidad ?? '').toLowerCase().includes(busq);
      const matchCliente = !cliente || s.cliente === cliente;
      const matchDesde = !desde || s.fecha >= desde;
      const matchHasta = !hasta || s.fecha <= hasta;
      const matchOp = opFiltro === 'Todos' || s.estado === (opFiltro as EstadoServicioAdmin);
      const matchAdm = admFiltro === 'Todos' || s.estadoAdministrativo === (admFiltro as EstadoAdminServicio);
      return matchBusq && matchCliente && matchDesde && matchHasta && matchOp && matchAdm;
    });
  });

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.serviciosFiltrados().length / this.ITEMS_POR_PAGINA))
  );

  protected readonly serviciosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA;
    return this.serviciosFiltrados().slice(inicio, inicio + this.ITEMS_POR_PAGINA);
  });

  protected readonly paginas = computed(() => {
    const total  = this.totalPaginas();
    const actual = this.paginaActual();
    const inicio = Math.max(1, actual - 2);
    const fin    = Math.min(total, actual + 2);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  ngOnInit(): void {
    this.adminSvc.getReportes().subscribe((data) => this.servicios.set(data));
  }

  protected onFacturar(): void {
    const s = this.servicioFacturar();
    if (!s) return;
    this.guardandoFactura.set(true);
    this.errorAccion.set(null);
    this.adminSvc.updEstadoAdministrativo(parseInt(s.id.replace(/\D/g, ''), 10), 'Facturado').subscribe({
      next: (res) => {
        if (res.exitoso === 1) {
          this.servicios.update((prev) => prev.map((srv) => srv.id === s.id ? { ...srv, estadoAdministrativo: 'Facturado' as EstadoAdminServicio } : srv));
          this.servicioFacturar.set(null);
        } else {
          this.errorAccion.set(res.mensaje);
        }
        this.guardandoFactura.set(false);
      },
      error: () => {
        this.errorAccion.set('Error al procesar la solicitud. Intente nuevamente.');
        this.guardandoFactura.set(false);
      },
    });
  }

  protected onRegistrarPago(): void {
    const s = this.servicioPago();
    if (!s) return;
    this.guardandoPago.set(true);
    this.errorAccion.set(null);
    this.adminSvc.updEstadoAdministrativo(parseInt(s.id.replace(/\D/g, ''), 10), 'Pagado').subscribe({
      next: (res) => {
        if (res.exitoso === 1) {
          this.servicios.update((prev) => prev.map((srv) => srv.id === s.id ? { ...srv, estadoAdministrativo: 'Pagado' as EstadoAdminServicio } : srv));
          this.servicioPago.set(null);
        } else {
          this.errorAccion.set(res.mensaje);
        }
        this.guardandoPago.set(false);
      },
      error: () => {
        this.errorAccion.set('Error al procesar la solicitud. Intente nuevamente.');
        this.guardandoPago.set(false);
      },
    });
  }

  protected cerrarFacturar(): void {
    this.servicioFacturar.set(null);
    this.errorAccion.set(null);
  }

  protected cerrarPago(): void {
    this.servicioPago.set(null);
    this.errorAccion.set(null);
  }

  protected abrirRevisionCancelacion(s: ServicioReporte): void {
    this.servicioRevision.set(s);
  }

  protected cambiarPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
  }

  protected rangoMostrado(): string {
    const total = this.serviciosFiltrados().length;
    if (total === 0) return '0';
    const desde = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA + 1;
    const hasta  = Math.min(this.paginaActual() * this.ITEMS_POR_PAGINA, total);
    return `${desde} - ${hasta}`;
  }

  protected setBusqueda(v: string): void        { this.busqueda.set(v);        this.paginaActual.set(1); }
  protected setFiltroCliente(v: string): void   { this.filtroCliente.set(v);   this.paginaActual.set(1); }
  protected setFechaDesde(v: string): void      { this.fechaDesde.set(v);      this.paginaActual.set(1); }
  protected setFechaHasta(v: string): void      { this.fechaHasta.set(v);      this.paginaActual.set(1); }
  protected setFiltroOp(f: FiltroOperativo): void { this.filtroOperativo.set(f); this.paginaActual.set(1); }
  protected setFiltroAdm(f: FiltroAdmin): void    { this.filtroAdmin.set(f);     this.paginaActual.set(1); }

  protected estadoOperClass(estado: string): string {
    switch (estado) {
      case 'Finalizado': return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
      case 'Cancelado': return 'bg-[#fef2f2] text-[#c10007] border-[#fca5a5]';
      default: return 'bg-[#f3f4f6] text-[#4a5565]';
    }
  }

  protected estadoAdminClass(estado: string): string {
    switch (estado) {
      case 'Pagado': return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
      case 'Facturado': return 'bg-[#fef9c3] text-[#854d0e] border-[#fde68a]';
      case 'Pendiente': return 'bg-[#f3f4f6] text-[#4a5565] border-[#e5e7eb]';
      default: return 'bg-[#f3f4f6] text-[#4a5565]';
    }
  }
}
