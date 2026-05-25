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
import { ReportesService } from '../../../core/services/reportes.service';
import { ServicioReporte } from '../../../models/reportes.model';
import { AccionFacturarComponent } from './accion-facturar/accion-facturar';
import { AccionRegistrarPagoComponent } from './accion-registrar-pago/accion-registrar-pago';
import { RevisionCancelacionComponent } from './revision-cancelacion/revision-cancelacion';
import { ExitoModalComponent } from '../../../shared/components/exito-modal/exito-modal';
import { MensajeModalComponent } from '../../../shared/components/mensaje-modal/mensaje-modal';

type FiltroOperativo = 'Todos' | 'FINALIZADO' | 'CANCELADO';
type FiltroAdmin = 'Todos' | 'PENDIENTE' | 'FACTURADO' | 'PAGADO';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, AccionFacturarComponent, AccionRegistrarPagoComponent, RevisionCancelacionComponent, ExitoModalComponent, MensajeModalComponent],
  templateUrl: './reportes.html',
})
export class ReportesComponent implements OnInit {
  private readonly reportesSvc = inject(ReportesService);

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

  protected readonly filtrosOperativos: FiltroOperativo[] = ['Todos', 'FINALIZADO', 'CANCELADO'];
  protected readonly filtrosAdmin: FiltroAdmin[] = ['Todos', 'PENDIENTE', 'FACTURADO', 'PAGADO'];

  protected readonly servicioFacturar    = signal<ServicioReporte | null>(null);
  protected readonly servicioPago        = signal<ServicioReporte | null>(null);
  protected readonly servicioRevision    = signal<ServicioReporte | null>(null);

  protected readonly guardandoFactura = signal(false);
  protected readonly guardandoPago    = signal(false);
  protected readonly errorAccion      = signal<string | null>(null);

  protected readonly showExitoFactura  = signal(false);
  protected readonly showExitoPago     = signal(false);
  protected readonly showErrorFactura  = signal(false);
  protected readonly showErrorPago     = signal(false);
  protected readonly mensajeResultado  = signal('');
  protected readonly servicioResultado = signal<ServicioReporte | null>(null);

  protected readonly clientesUnicos = computed(() => [...new Set(this.servicios().map((s) => s.cliente))].sort());

  protected readonly totalServicios = computed(() => this.servicios().length);
  protected readonly finalizados = computed(() => this.servicios().filter((s) => s.estado === 'FINALIZADO').length);
  protected readonly cancelados = computed(() => this.servicios().filter((s) => s.estado === 'CANCELADO').length);
  protected readonly montoTotal = computed(() => this.servicios().filter((s) => s.estado === 'FINALIZADO').reduce((sum, s) => sum + s.costo, 0));

  protected readonly pendientes = computed(() => this.serviciosFiltrados().filter((s) => s.estadoAdministrativo === 'PENDIENTE' && s.estado === 'FINALIZADO').length);
  protected readonly facturados = computed(() => this.serviciosFiltrados().filter((s) => s.estadoAdministrativo === 'FACTURADO').length);
  protected readonly pagados = computed(() => this.serviciosFiltrados().filter((s) => s.estadoAdministrativo === 'PAGADO').length);

  protected readonly serviciosFiltrados = computed(() => {
    const busq = this.busqueda().toLowerCase();
    const cliente = this.filtroCliente();
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    const opFiltro = this.filtroOperativo();
    const admFiltro = this.filtroAdmin();
    return this.servicios().filter((s) => {
      const matchBusq = !busq || String(s.id).includes(busq) || (s.unidad ?? '').toLowerCase().includes(busq);
      const matchCliente = !cliente || s.cliente === cliente;
      const matchDesde = !desde || s.fecha >= desde;
      const matchHasta = !hasta || s.fecha <= hasta;
      const matchOp = opFiltro === 'Todos' || s.estado === opFiltro;
      const matchAdm = admFiltro === 'Todos' || s.estadoAdministrativo === admFiltro;
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
    this.reportesSvc.getReportes().subscribe((data) => this.servicios.set(data));
  }

  protected onFacturar(): void {
    const s = this.servicioFacturar();
    if (!s) return;
    this.guardandoFactura.set(true);
    this.errorAccion.set(null);
    this.reportesSvc.updEstadoAdministrativo(s.id, 'FACTURADO').subscribe({
      next: (res) => {
        this.guardandoFactura.set(false);
        this.servicioFacturar.set(null);
        this.mensajeResultado.set(res.mensaje);
        if (res.exitoso === 1) {
          this.servicios.update((prev) => prev.map((srv) => srv.id === s.id ? { ...srv, estadoAdministrativo: 'FACTURADO' } : srv));
          this.servicioResultado.set(s);
          this.showExitoFactura.set(true);
        } else {
          this.showErrorFactura.set(true);
        }
      },
      error: (err) => {
        this.guardandoFactura.set(false);
        this.servicioFacturar.set(null);
        this.mensajeResultado.set(err?.error?.mensaje ?? 'Error al procesar la solicitud. Intente nuevamente.');
        this.showErrorFactura.set(true);
      },
    });
  }

  protected onRegistrarPago(): void {
    const s = this.servicioPago();
    if (!s) return;
    this.guardandoPago.set(true);
    this.errorAccion.set(null);
    this.reportesSvc.updEstadoAdministrativo(s.id, 'PAGADO').subscribe({
      next: (res) => {
        this.guardandoPago.set(false);
        this.servicioPago.set(null);
        this.mensajeResultado.set(res.mensaje);
        if (res.exitoso === 1) {
          this.servicios.update((prev) => prev.map((srv) => srv.id === s.id ? { ...srv, estadoAdministrativo: 'PAGADO' } : srv));
          this.servicioResultado.set(s);
          this.showExitoPago.set(true);
        } else {
          this.showErrorPago.set(true);
        }
      },
      error: (err) => {
        this.guardandoPago.set(false);
        this.servicioPago.set(null);
        this.mensajeResultado.set(err?.error?.mensaje ?? 'Error al procesar la solicitud. Intente nuevamente.');
        this.showErrorPago.set(true);
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
      case 'FINALIZADO': return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
      case 'CANCELADO':  return 'bg-[#fef2f2] text-[#c10007] border-[#fca5a5]';
      default:           return 'bg-[#f3f4f6] text-[#4a5565]';
    }
  }

  protected estadoAdminClass(estado: string): string {
    switch (estado) {
      case 'PAGADO':    return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
      case 'FACTURADO': return 'bg-[#fef9c3] text-[#854d0e] border-[#fde68a]';
      case 'PENDIENTE': return 'bg-[#f3f4f6] text-[#4a5565] border-[#e5e7eb]';
      default:          return 'bg-[#f3f4f6] text-[#4a5565]';
    }
  }

  protected estadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      FINALIZADO: 'Finalizado', CANCELADO: 'Cancelado', RESERVADO: 'Reservado',
      ASIGNADO: 'Asignado', ENCURSO: 'En Curso',
    };
    return labels[estado] ?? estado;
  }

  protected estadoAdminLabel(estado: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente', FACTURADO: 'Facturado', PAGADO: 'Pagado',
    };
    return labels[estado] ?? estado;
  }
}
