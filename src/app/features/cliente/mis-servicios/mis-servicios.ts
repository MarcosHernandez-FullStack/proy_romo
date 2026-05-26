import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, merge } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import {
  LucideAngularModule,
  Download,
  Eye,
  Car,
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  Hash,
  MapPin,
} from 'lucide-angular';
import { ReservasService } from '../../../core/services/reservas.service';
import { DetalleServicio, ReservaPagedDto } from '../../../models/operaciones.model';
import { DetalleServicioComponent } from './detalle-servicio/detalle-servicio';

const TAMANO = 10;

const EMPTY_PAGED: ReservaPagedDto = {
  total: 0, totalReservado: 0, totalAsignado: 0, totalEnCurso: 0,
  montoPendiente: 0, montoLiquidado: 0, datos: [],
};

@Component({
  selector: 'app-mis-servicios',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, DetalleServicioComponent],
  templateUrl: './mis-servicios.html',
})
export class MisServiciosComponent implements OnInit {
  private readonly reservasSvc = inject(ReservasService);
  private readonly destroyRef  = inject(DestroyRef);

  protected readonly DownloadIcon     = Download;
  protected readonly EyeIcon          = Eye;
  protected readonly CarIcon          = Car;
  protected readonly ChevronLeftIcon  = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;
  protected readonly FileTextIcon     = FileText;
  protected readonly DollarSignIcon   = DollarSign;
  protected readonly HashIcon         = Hash;
  protected readonly MapPinIcon       = MapPin;

  protected readonly filtrosOp:    string[] = ['TODOS', 'RESERVADO', 'ASIGNADO', 'ENCURSO', 'FINALIZADO', 'CANCELADO'];
  protected readonly filtrosAdmin: string[] = ['TODOS', 'PENDIENTE', 'FACTURADO', 'PAGADO'];

  // ── Filtros ────────────────────────────────────────────────
  protected readonly filtroId        = signal('');
  protected readonly fechaDesde      = signal('');
  protected readonly fechaHasta      = signal('');
  protected readonly filtroDireccion = signal('');
  protected readonly filtroOp        = signal('TODOS');
  protected readonly filtroAdmin     = signal('TODOS');
  protected readonly paginaActual    = signal(1);

  // ── Estado ─────────────────────────────────────────────────
  protected readonly cargando = signal(false);
  protected readonly paged    = signal<ReservaPagedDto>(EMPTY_PAGED);

  protected readonly datos = () => this.paged().datos;

  // ── KPIs desde servidor ────────────────────────────────────
  protected readonly totalRegistros = () => this.paged().total;
  protected readonly enOperacion    = () => this.paged().totalAsignado + this.paged().totalEnCurso;
  protected readonly montoPendiente = () => this.paged().montoPendiente;
  protected readonly montoLiquidado = () => this.paged().montoLiquidado;

  protected readonly totalPaginas = () => Math.max(1, Math.ceil(this.totalRegistros() / TAMANO));
  protected readonly paginas      = () => {
    const total  = this.totalPaginas();
    const actual = this.paginaActual();
    const inicio = Math.max(1, actual - 2);
    const fin    = Math.min(total, actual + 2);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  };

  // ── Detalle modal ──────────────────────────────────────────
  protected readonly detalle        = signal<DetalleServicio | null>(null);
  protected readonly showDetalle    = signal(false);
  protected readonly detalleLoading = signal(false);

  private readonly _idChange$        = new Subject<string>();
  private readonly _direccionChange$ = new Subject<string>();
  private readonly _reload$          = new Subject<void>();

  ngOnInit(): void {
    merge(
      this._idChange$.pipe(debounceTime(600),        distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._direccionChange$.pipe(debounceTime(400), distinctUntilChanged(), tap(() => this.paginaActual.set(1))),
      this._reload$,
    ).pipe(
      switchMap(() => {
        this.cargando.set(true);
        const idStr = this.filtroId().trim();
        const op    = this.filtroOp();
        const adm   = this.filtroAdmin();
        return this.reservasSvc.getServicios({
          id:                   idStr ? Number(idStr) : undefined,
          estadoOperacion:      op  !== 'TODOS' ? op  : undefined,
          estadoAdministrativo: adm !== 'TODOS' ? adm : undefined,
          fechaInicio:          this.fechaDesde()           || undefined,
          fechaFin:             this.fechaHasta()           || undefined,
          direccion:            this.filtroDireccion().trim() || undefined,
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

  protected cargar(): void { this._reload$.next(); }

  protected onIdChange(v: string): void          { this.filtroId.set(v);         this._idChange$.next(v); }
  protected setFechaDesde(v: string): void       { this.fechaDesde.set(v);       this.paginaActual.set(1); this._reload$.next(); }
  protected setFechaHasta(v: string): void       { this.fechaHasta.set(v);       this.paginaActual.set(1); this._reload$.next(); }
  protected onDireccionChange(v: string): void   { this.filtroDireccion.set(v);  this._direccionChange$.next(v); }

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

  protected setFiltroOp(f: string): void    { this.filtroOp.set(f);    this.paginaActual.set(1); this._reload$.next(); }
  protected setFiltroAdmin(f: string): void { this.filtroAdmin.set(f); this.paginaActual.set(1); this._reload$.next(); }

  protected vehiculosLabel(n: number): string {
    return n === 1 ? '1 Vehículo' : `${n} Vehículos`;
  }

  protected estadoOpLabel(estado: string): string {
    switch (estado) {
      case 'TODOS':      return 'Todos';
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
      case 'TODOS':     return 'Todos';
      case 'PENDIENTE': return 'Pendiente';
      case 'FACTURADO': return 'Facturado';
      case 'PAGADO':    return 'Pagado';
      default:          return estado;
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
}
