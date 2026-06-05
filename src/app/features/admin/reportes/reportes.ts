import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import ExcelJS from 'exceljs';
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

  protected readonly exportando        = signal(false);
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

  protected onExportarExcel(): void {
    if (this.exportando()) return;
    this.exportando.set(true);
    const idStr = this.filtroId().trim();
    this.reportesSvc.getReportes({
      id:                   idStr ? Number(idStr) : undefined,
      placa:                this.filtroPlaca().trim()   || undefined,
      empresa:              this.filtroEmpresa().trim() || undefined,
      fechaDesde:           this.fechaDesde()           || undefined,
      fechaHasta:           this.fechaHasta()           || undefined,
      estadoOperacion:      this.filtroOp()  !== 'Todos' ? this.filtroOp()  : undefined,
      estadoAdministrativo: this.filtroAdm() !== 'Todos' ? this.filtroAdm() : undefined,
    }).subscribe({
      next:  data  => this.generarExcel(data).finally(() => this.exportando.set(false)),
      error: ()    => this.exportando.set(false),
    });
  }

  private async generarExcel(data: ReportePagedDto): Promise<void> {
    const { datos, total, finalizados, cancelados, montoTotal, pendientes, facturados, pagados } = data;

    const wb   = new ExcelJS.Workbook();
    wb.creator = 'ROMO Sistema';
    wb.created = new Date();

    const ws = wb.addWorksheet('Cobranzas');

    // ── Fila 1: Título ─────────────────────────────────────────────
    ws.mergeCells(1, 1, 1, 13);
    const celdaTitulo     = ws.getCell('A1');
    const fechaHoy        = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    celdaTitulo.value     = `Reporte de Cobranzas — ROMO | Generado: ${fechaHoy}`;
    celdaTitulo.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 13 };
    celdaTitulo.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF155DFC' } };
    celdaTitulo.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height   = 28;

    // ── Filas 2-6: KPIs ────────────────────────────────────────────
    const setKpi = (
      labelRow: number, valueRow: number,
      c1: number, c2: number,
      label: string, value: string | number,
      bg: string, fg: string
    ) => {
      ws.mergeCells(labelRow, c1, labelRow, c2);
      ws.mergeCells(valueRow, c1, valueRow, c2);

      const lc      = ws.getCell(labelRow, c1);
      lc.value      = label;
      lc.fill       = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      lc.font       = { size: 9, color: { argb: fg } };
      lc.alignment  = { horizontal: 'center', vertical: 'bottom' };

      const vc      = ws.getCell(valueRow, c1);
      vc.value      = value;
      vc.fill       = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      vc.font       = { size: 18, bold: true, color: { argb: fg } };
      vc.alignment  = { horizontal: 'center', vertical: 'middle' };
    };

    const montoStr = `USD ${montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    setKpi(2, 3, 1,  3,  'Total Servicios', total,       'FFEFF6FF', 'FF155DFC');
    setKpi(2, 3, 4,  6,  'Finalizados',     finalizados, 'FFF0FDF4', 'FF008236');
    setKpi(2, 3, 7,  9,  'Cancelados',      cancelados,  'FFFEF2F2', 'FFC10007');
    setKpi(2, 3, 10, 13, 'Monto Total',     montoStr,    'FFEFF6FF', 'FF155DFC');
    ws.getRow(2).height = 18;
    ws.getRow(3).height = 38;

    ws.getRow(4).height = 8;

    ws.mergeCells(5, 1, 5, 13);
    const celdaAdm     = ws.getCell(5, 1);
    celdaAdm.value     = 'Estados Administrativos';
    celdaAdm.font      = { bold: true, color: { argb: 'FF364153' }, size: 10 };
    celdaAdm.fill      = { type: 'pattern', pattern: 'none' };
    celdaAdm.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    ws.getRow(5).height = 20;

    setKpi(6, 7, 1,  4,  'Pendientes', pendientes, 'FFF3F4F6', 'FF4A5565');
    setKpi(6, 7, 5,  9,  'Facturados', facturados, 'FFFEF9C3', 'FF854D0E');
    setKpi(6, 7, 10, 13, 'Pagados',    pagados,    'FFDCFCE7', 'FF166534');
    ws.getRow(6).height = 18;
    ws.getRow(7).height = 38;

    ws.getRow(8).height = 8;

    // ── Fila 9: Encabezados tabla ──────────────────────────────────
    const filaHeaders = ws.addRow([
      'ID', 'Fecha', 'Hora', 'Cliente B2B', 'Grúa', 'Operador',
      'Origen', 'Destino', 'Distancia (km)', 'Monto (USD)',
      'Est. Operativo', 'Est. Administrativo', 'Motivo Cancelación',
    ]);
    filaHeaders.eachCell(c => {
      c.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border    = { bottom: { style: 'thin', color: { argb: 'FF93C5FD' } } };
    });
    ws.getRow(9).height = 22;

    // ── Filas 10+: Datos ───────────────────────────────────────────
    datos.forEach((s, i) => {
      const fila  = ws.addRow([
        s.id,
        s.fechaCorta        || null,
        s.hora              || null,
        s.cliente           || null,
        s.grua === '—'      ? null : (s.grua || null),
        s.operador          || null,
        s.origen            || null,
        s.destino           || null,
        s.distanciaKm,
        s.costo,
        s.estado            || null,
        s.estado === 'Cancelado' ? 'N/A' : (s.estadoAdministrativo || null),
        s.motivoCancelacion || null,
      ]);
      const bgArgb = i % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB';
      fila.eachCell(c => {
        c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        c.font      = { size: 10, color: { argb: 'FF101828' } };
        c.alignment = { vertical: 'middle' };
      });
      fila.getCell(10).numFmt = '#,##0.00';
      this.colorEstadoOp(fila.getCell(11), s.estado);
      if (s.estado !== 'Cancelado') this.colorEstadoAdm(fila.getCell(12), s.estadoAdministrativo);
      fila.height = 20;
    });

    const anchos = [8, 12, 8, 30, 20, 25, 35, 35, 14, 12, 16, 20, 30];
    anchos.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    const fecha  = new Date().toISOString().split('T')[0];
    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `reporte_cobranzas_${fecha}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private colorEstadoOp(cell: ExcelJS.Cell, estado: string): void {
    const estilos: Record<string, { bg: string; text: string }> = {
      'Finalizado': { bg: 'FFDCFCE7', text: 'FF166534' },
      'Cancelado':  { bg: 'FFFEF2F2', text: 'FFC10007' },
    };
    const e = estilos[estado];
    if (!e) return;
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: e.bg } };
    cell.font      = { size: 10, color: { argb: e.text }, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  private colorEstadoAdm(cell: ExcelJS.Cell, estado: string): void {
    const estilos: Record<string, { bg: string; text: string }> = {
      'Pagado':    { bg: 'FFDCFCE7', text: 'FF166534' },
      'Facturado': { bg: 'FFFEF9C3', text: 'FF854D0E' },
      'Pendiente': { bg: 'FFF3F4F6', text: 'FF4A5565' },
    };
    const e = estilos[estado];
    if (!e) return;
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: e.bg } };
    cell.font      = { size: 10, color: { argb: e.text }, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

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
