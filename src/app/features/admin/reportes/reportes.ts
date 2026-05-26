import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, merge } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
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
  RefreshCw,
  Hash,
  X,
} from 'lucide-angular';
import { ReportesService } from '../../../core/services/reportes.service';
import { ReportePagedDto, ServicioReporte } from '../../../models/reportes.model';
import { AccionFacturarComponent } from './accion-facturar/accion-facturar';
import { AccionRegistrarPagoComponent } from './accion-registrar-pago/accion-registrar-pago';
import { RevisionCancelacionComponent } from './revision-cancelacion/revision-cancelacion';
import { ExitoModalComponent } from '../../../shared/components/exito-modal/exito-modal';
import { MensajeModalComponent } from '../../../shared/components/mensaje-modal/mensaje-modal';

type FiltroOperativo = 'Todos' | 'FINALIZADO' | 'CANCELADO';
type FiltroAdmin     = 'Todos' | 'PENDIENTE' | 'FACTURADO' | 'PAGADO';

const TAMANO = 10;

const EMPTY_PAGED: ReportePagedDto = {
  total: 0, finalizados: 0, cancelados: 0, montoTotal: 0,
  pendientes: 0, facturados: 0, pagados: 0, datos: [],
};

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, AccionFacturarComponent, AccionRegistrarPagoComponent, RevisionCancelacionComponent, ExitoModalComponent, MensajeModalComponent],
  templateUrl: './reportes.html',
})
export class ReportesComponent implements OnInit {
  private readonly reportesSvc = inject(ReportesService);
  private readonly destroyRef  = inject(DestroyRef);

  protected readonly FileBarChart2Icon = FileBarChart2;
  protected readonly DownloadIcon      = Download;
  protected readonly SearchIcon        = Search;
  protected readonly CheckCircleIcon   = CheckCircle;
  protected readonly XCircleIcon       = XCircle;
  protected readonly DollarSignIcon    = DollarSign;
  protected readonly FileTextIcon      = FileText;
  protected readonly Building2Icon     = Building2;
  protected readonly TruckIcon         = Truck;
  protected readonly CalendarIcon      = Calendar;
  protected readonly ChevronDownIcon   = ChevronDown;
  protected readonly ChevronLeftIcon   = ChevronLeft;
  protected readonly ChevronRightIcon  = ChevronRight;
  protected readonly EyeIcon           = Eye;
  protected readonly RefreshCwIcon     = RefreshCw;
  protected readonly HashIcon          = Hash;
  protected readonly XIcon             = X;

  protected readonly filtrosOperativos: FiltroOperativo[] = ['Todos', 'FINALIZADO', 'CANCELADO'];
  protected readonly filtrosAdmin:      FiltroAdmin[]     = ['Todos', 'PENDIENTE', 'FACTURADO', 'PAGADO'];

  // ── Filtros ────────────────────────────────────────────────
  protected readonly filtroId      = signal('');
  protected readonly filtroPlaca   = signal('');
  protected readonly filtroEmpresa = signal('');
  protected readonly fechaDesde    = signal('');
  protected readonly fechaHasta    = signal('');
  protected readonly filtroOp      = signal<FiltroOperativo>('Todos');
  protected readonly filtroAdm     = signal<FiltroAdmin>('Todos');
  protected readonly paginaActual  = signal(1);

  // ── Estado ─────────────────────────────────────────────────
  protected readonly cargando  = signal(false);
  protected readonly paged     = signal<ReportePagedDto>(EMPTY_PAGED);

  protected readonly servicios = () => this.paged().datos;

  // ── KPIs desde servidor ────────────────────────────────────
  protected readonly totalRegistros = () => this.paged().total;
  protected readonly finalizados    = () => this.paged().finalizados;
  protected readonly cancelados     = () => this.paged().cancelados;
  protected readonly montoTotal     = () => this.paged().montoTotal;
  protected readonly pendientes     = () => this.paged().pendientes;
  protected readonly facturados     = () => this.paged().facturados;
  protected readonly pagados        = () => this.paged().pagados;
  protected readonly totalPaginas   = () => Math.max(1, Math.ceil(this.totalRegistros() / TAMANO));
  protected readonly paginas        = () => {
    const total  = this.totalPaginas();
    const actual = this.paginaActual();
    const inicio = Math.max(1, actual - 2);
    const fin    = Math.min(total, actual + 2);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  };

  // ── Modales de acción ──────────────────────────────────────
  protected readonly servicioFacturar = signal<ServicioReporte | null>(null);
  protected readonly servicioPago     = signal<ServicioReporte | null>(null);
  protected readonly servicioRevision = signal<ServicioReporte | null>(null);

  protected readonly guardandoFactura = signal(false);
  protected readonly guardandoPago    = signal(false);
  protected readonly errorAccion      = signal<string | null>(null);

  protected readonly showExitoFactura  = signal(false);
  protected readonly showExitoPago     = signal(false);
  protected readonly showErrorFactura  = signal(false);
  protected readonly showErrorPago     = signal(false);
  protected readonly mensajeResultado  = signal('');
  protected readonly servicioResultado = signal<ServicioReporte | null>(null);

  // ── Subjects para debounce independiente ──────────────────
  private readonly _idChange$      = new Subject<string>();
  private readonly _placaChange$   = new Subject<string>();
  private readonly _empresaChange$ = new Subject<string>();
  private readonly _reload$        = new Subject<void>();

  protected get hasFiltros(): boolean {
    return !!this.filtroId() || !!this.filtroPlaca() || !!this.filtroEmpresa() ||
           !!this.fechaDesde() || !!this.fechaHasta() ||
           this.filtroOp() !== 'Todos' || this.filtroAdm() !== 'Todos';
  }

  ngOnInit(): void {
    merge(
      this._idChange$.pipe(debounceTime(600),      distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._placaChange$.pipe(debounceTime(400),   distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._empresaChange$.pipe(debounceTime(400), distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._reload$,
    ).pipe(
      switchMap(() => {
        this.cargando.set(true);
        const idStr = this.filtroId().trim();
        return this.reportesSvc.getReportes({
          id:                   idStr ? Number(idStr) : undefined,
          placa:                this.filtroPlaca().trim()   || undefined,
          empresa:              this.filtroEmpresa().trim() || undefined,
          fechaDesde:           this.fechaDesde()           || undefined,
          fechaHasta:           this.fechaHasta()           || undefined,
          estadoOperacion:      this.filtroOp()  !== 'Todos' ? this.filtroOp()  : undefined,
          estadoAdministrativo: this.filtroAdm() !== 'Todos' ? this.filtroAdm() : undefined,
          pagina:               this.paginaActual(),
          tamano:               TAMANO,
        }).pipe(catchError(() => { this.cargando.set(false); return EMPTY; }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(data => {
      this.paged.set(data);
      this.cargando.set(false);
    });

    this._reload$.next();
  }

  protected cargarReportes(): void { this._reload$.next(); }

  protected limpiarFiltros(): void {
    this.filtroId.set('');
    this.filtroPlaca.set('');
    this.filtroEmpresa.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.filtroOp.set('Todos');
    this.filtroAdm.set('Todos');
    this.paginaActual.set(1);
    this._reload$.next();
  }

  protected onIdChange(v: string): void      { this.filtroId.set(v);      this._idChange$.next(v); }
  protected onPlacaChange(v: string): void   { this.filtroPlaca.set(v);   this._placaChange$.next(v); }
  protected onEmpresaChange(v: string): void { this.filtroEmpresa.set(v); this._empresaChange$.next(v); }
  protected setFechaDesde(v: string): void   { this.fechaDesde.set(v);    this.paginaActual.set(1); this._reload$.next(); }
  protected setFechaHasta(v: string): void   { this.fechaHasta.set(v);    this.paginaActual.set(1); this._reload$.next(); }
  protected setFiltroOp(f: FiltroOperativo): void { this.filtroOp.set(f);  this.paginaActual.set(1); this._reload$.next(); }
  protected setFiltroAdm(f: FiltroAdmin): void    { this.filtroAdm.set(f); this.paginaActual.set(1); this._reload$.next(); }

  protected cambiarPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
    this._reload$.next();
  }

  protected rangoMostrado(): string {
    const total = this.totalRegistros();
    if (total === 0) return '0';
    const desde = (this.paginaActual() - 1) * TAMANO + 1;
    const hasta  = Math.min(this.paginaActual() * TAMANO, total);
    return `${desde} - ${hasta}`;
  }

  // ── Acciones ───────────────────────────────────────────────
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
          this.servicioResultado.set(s);
          this.showExitoFactura.set(true);
          this._reload$.next();
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
          this.servicioResultado.set(s);
          this.showExitoPago.set(true);
          this._reload$.next();
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

  protected cerrarFacturar(): void { this.servicioFacturar.set(null); this.errorAccion.set(null); }
  protected cerrarPago(): void     { this.servicioPago.set(null);     this.errorAccion.set(null); }

  protected abrirRevisionCancelacion(s: ServicioReporte): void { this.servicioRevision.set(s); }

  protected estadoOperClass(estado: string): string {
    switch (estado) {
      case 'Finalizado': return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
      case 'Cancelado':  return 'bg-[#fef2f2] text-[#c10007] border-[#fca5a5]';
      default:           return 'bg-[#f3f4f6] text-[#4a5565]';
    }
  }

  protected estadoAdminClass(estado: string): string {
    switch (estado) {
      case 'Pagado':    return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
      case 'Facturado': return 'bg-[#fef9c3] text-[#854d0e] border-[#fde68a]';
      case 'Pendiente': return 'bg-[#f3f4f6] text-[#4a5565] border-[#e5e7eb]';
      default:          return 'bg-[#f3f4f6] text-[#4a5565]';
    }
  }
}
