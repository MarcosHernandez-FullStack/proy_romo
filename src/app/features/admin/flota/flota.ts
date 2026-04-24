import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Truck,
  Plus,
  Search,
  Pencil,
  FileText,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Shield,
  Tag,
  Users2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { EstadoUnidad, GruaRequest, ServicioAdmin, UnidadFlota } from '../../../models/admin.model';
import { NuevaUnidadComponent } from './nueva-unidad/nueva-unidad';
import { EditarUnidadComponent } from './editar-unidad/editar-unidad';
import { DetalleUnidadComponent } from './detalle-unidad/detalle-unidad';
import { LiberarServicioComponent } from './liberar-servicio/liberar-servicio';
import { RetornoOperativaComponent, RetornoData } from './retorno-operativa/retorno-operativa';

type FiltroFlota = 'Activas' | 'En Taller' | 'Bajas';

@Component({
  selector: 'app-flota',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, NuevaUnidadComponent, EditarUnidadComponent, DetalleUnidadComponent, LiberarServicioComponent, RetornoOperativaComponent],
  templateUrl: './flota.html',
})
export class FlotaComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly TruckIcon = Truck;
  protected readonly PlusIcon = Plus;
  protected readonly SearchIcon = Search;
  protected readonly PencilIcon = Pencil;
  protected readonly FileTextIcon = FileText;
  protected readonly RotateCcwIcon = RotateCcw;
  protected readonly Trash2Icon = Trash2;
  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly WrenchIcon = Wrench;
  protected readonly ShieldIcon = Shield;
  protected readonly TagIcon          = Tag;
  protected readonly Users2Icon       = Users2;
  protected readonly ChevronLeftIcon  = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;

  readonly ITEMS_POR_PAGINA = 10;

  protected readonly flota = signal<UnidadFlota[]>([]);
  protected readonly filtroFlota  = signal<FiltroFlota>('Activas');
  protected readonly filtrosFlota: FiltroFlota[] = ['Activas', 'En Taller', 'Bajas'];
  protected readonly busqueda     = signal('');
  protected readonly paginaActual = signal(1);

  protected readonly showNueva = signal(false);
  protected readonly unidadEditar = signal<UnidadFlota | null>(null);
  protected readonly unidadDetalle = signal<UnidadFlota | null>(null);
  protected readonly unidadLiberar  = signal<UnidadFlota | null>(null);
  protected readonly unidadRetorno  = signal<UnidadFlota | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);

  private readonly operaciones = signal<ServicioAdmin[]>([]);

  protected readonly totalUnidades   = computed(() => this.flota().length);
  protected readonly operativas      = computed(() => this.flota().filter(u => u.estado === 'Operativa').length);
  protected readonly enTaller        = computed(() => this.flota().filter(u => u.estado === 'En Taller').length);
  protected readonly segurosCriticos = computed(() => this.flota().filter(u => {
    const badge = this.seguroBadge(u.vencimientoSeguro);
    return badge === 'POR VENCER' || badge === 'VENCIDO';
  }).length);

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.flotaFiltrada().length / this.ITEMS_POR_PAGINA))
  );

  protected readonly flotaPaginada = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA;
    return this.flotaFiltrada().slice(inicio, inicio + this.ITEMS_POR_PAGINA);
  });

  protected readonly paginas = computed(() => {
    const total  = this.totalPaginas();
    const actual = this.paginaActual();
    const inicio = Math.max(1, actual - 2);
    const fin    = Math.min(total, actual + 2);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  protected readonly flotaFiltrada = computed(() => {
    const filtro = this.filtroFlota();
    const busq = this.busqueda().toLowerCase();
    const estadoMap: Record<FiltroFlota, EstadoUnidad> = {
      Activas: 'Operativa',
      'En Taller': 'En Taller',
      Bajas: 'Baja',
    };
    return this.flota().filter(
      (u) =>
        u.estado === estadoMap[filtro] &&
        (!busq || u.placa.toLowerCase().includes(busq) || u.marca.toLowerCase().includes(busq) || u.modelo.toLowerCase().includes(busq) || u.id.toLowerCase().includes(busq))
    );
  });

  ngOnInit(): void {
    this.cargarFlota();
    this.adminSvc.getOperaciones().subscribe((data) => this.operaciones.set(data));
  }

  protected cambiarFiltro(f: FiltroFlota): void {
    this.filtroFlota.set(f);
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
    const total = this.flotaFiltrada().length;
    if (total === 0) return '0';
    const desde = (this.paginaActual() - 1) * this.ITEMS_POR_PAGINA + 1;
    const hasta  = Math.min(this.paginaActual() * this.ITEMS_POR_PAGINA, total);
    return `${desde} - ${hasta}`;
  }

  private cargarFlota(): void {
    this.adminSvc.getFlota().subscribe((gruas) => this.flota.set(gruas));
  }

  protected serviciosDeUnidad(u: UnidadFlota): ServicioAdmin[] {
    return this.operaciones().filter(
      (s) =>
        (s.unidad === u.id || s.unidad === u.placa) &&
        s.estado !== 'Finalizado' &&
        s.estado !== 'Cancelado'
    );
  }

  protected onEstadoClick(u: UnidadFlota): void {
    if (u.estado === 'En Taller') {
      this.unidadRetorno.set(u);
    } else {
      this.unidadLiberar.set(u);
    }
  }

  protected abrirLiberarServicio(u: UnidadFlota): void {
    this.unidadLiberar.set(u);
  }

  protected onConfirmarRetorno(data: RetornoData): void {
    const u = this.unidadRetorno();
    if (!u) return;
    this.flota.update((prev) => prev.map((f) => (f.id === u.id ? { ...f, estado: 'Operativa' as EstadoUnidad } : f)));
    this.unidadRetorno.set(null);
  }

  protected onConfirmarLiberar(): void {
    const u = this.unidadLiberar();
    if (!u) return;
    this.flota.update((prev) => prev.map((f) => (f.id === u.id ? { ...f, estado: 'En Taller' as EstadoUnidad } : f)));
    this.operaciones.update((prev) =>
      prev.map((s) => (s.unidad === u.id || s.unidad === u.placa ? { ...s, unidad: null } : s))
    );
    this.unidadLiberar.set(null);
  }

  protected onNuevaUnidad(data: Omit<UnidadFlota, 'id'>): void {
    const req = this.toGruaRequest(data);
    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.adminSvc.crearGrua(req).subscribe({
      next: (result) => {
        this.guardando.set(false);
        if (result.exitoso === 0) { this.errorGuardar.set(result.mensaje); return; }
        this.showNueva.set(false);
        this.cargarFlota();
      },
      error: () => { this.guardando.set(false); this.errorGuardar.set('Error inesperado. Intente nuevamente.'); },
    });
  }

  protected onEditarUnidad(data: UnidadFlota): void {
    const idNumerico = parseInt(data.id.split('-')[1], 10);
    const req = this.toGruaRequest(data);
    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.adminSvc.editarGrua(idNumerico, req).subscribe({
      next: (result) => {
        this.guardando.set(false);
        if (result.exitoso === 0) { this.errorGuardar.set(result.mensaje); return; }
        this.unidadEditar.set(null);
        this.cargarFlota();
      },
      error: () => { this.guardando.set(false); this.errorGuardar.set('Error inesperado. Intente nuevamente.'); },
    });
  }

  private toGruaRequest(data: Omit<UnidadFlota, 'id'>): GruaRequest {
    return {
      placa:          data.placa,
      marca:          data.marca,
      modelo:         data.modelo,
      añoFabricacion: data.anio,
      capacidad:      data.capacidad,
      fecVenSeg:      data.vencimientoSeguro,
    };
  }

  protected darDeBaja(id: string): void {
    const idNumerico = parseInt(id.split('-')[1], 10);
    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.adminSvc.darDeBajaGrua(idNumerico).subscribe({
      next: (result) => {
        this.guardando.set(false);
        if (result.exitoso === 0) { this.errorGuardar.set(result.mensaje); return; }
        this.cargarFlota();
      },
      error: () => { this.guardando.set(false); this.errorGuardar.set('Error inesperado. Intente nuevamente.'); },
    });
  }

  protected reactivar(id: string): void {
    this.flota.update((prev) => prev.map((u) => (u.id === id ? { ...u, estado: 'Operativa' as EstadoUnidad } : u)));
  }

  protected estadoClass(estado: EstadoUnidad): string {
    switch (estado) {
      case 'Operativa': return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
      case 'En Taller': return 'bg-[#fef9c3] text-[#854d0e] border-[#fde68a]';
      case 'Baja': return 'bg-[#fef2f2] text-[#c10007] border-[#fca5a5]';
      default: return 'bg-[#f3f4f6] text-[#4a5565]';
    }
  }

  protected seguroBadge(fecha: string): 'VIGENTE' | 'POR VENCER' | 'VENCIDO' {
    if (!fecha) return 'VIGENTE';
    const now = Date.now();
    const ts = new Date(fecha).getTime();
    if (ts < now) return 'VENCIDO';
    if (ts < now + 30 * 24 * 60 * 60 * 1000) return 'POR VENCER';
    return 'VIGENTE';
  }

  protected seguroBadgeClass(badge: string): string {
    switch (badge) {
      case 'VIGENTE': return 'bg-[#f0fdf4] text-[#008236] border-[#7bf1a8]';
      case 'POR VENCER': return 'bg-[#fffbeb] text-[#b45309] border-[#fcd34d]';
      case 'VENCIDO': return 'bg-[#fef2f2] text-[#c10007] border-[#fca5a5]';
      default: return '';
    }
  }

  protected formatFecha(dateStr: string): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
}
