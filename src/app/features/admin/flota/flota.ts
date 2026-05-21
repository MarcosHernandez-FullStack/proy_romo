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
import { FlotaService } from '../../../core/services/flota.service';
import { EstadoUnidad, UnidadFlota } from '../../../models/flota.model';
import { NuevaUnidadComponent } from './nueva-unidad/nueva-unidad';
import { EditarUnidadComponent } from './editar-unidad/editar-unidad';
import { DetalleUnidadComponent } from './detalle-unidad/detalle-unidad';
import { LiberarServicioComponent } from './liberar-servicio/liberar-servicio';
import { RetornoOperativaComponent } from './retorno-operativa/retorno-operativa';
import { ExitoModalComponent } from '../../../shared/components/exito-modal/exito-modal';

type FiltroFlota = 'Activas' | 'En Taller' | 'Bajas';

@Component({
  selector: 'app-flota',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, NuevaUnidadComponent, EditarUnidadComponent, DetalleUnidadComponent, LiberarServicioComponent, RetornoOperativaComponent, ExitoModalComponent],
  templateUrl: './flota.html',
})
export class FlotaComponent implements OnInit {
  private readonly flotaSvc = inject(FlotaService);

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

  protected readonly exitoBaja       = signal<string | null>(null);
  protected readonly exitoReactivar  = signal<string | null>(null);
  protected readonly exitoLiberar    = signal<string | null>(null);
  protected readonly exitoRetorno    = signal<string | null>(null);

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
    this.flotaSvc.getFlota().subscribe((gruas) => this.flota.set(gruas));
  }

  protected onEstadoClick(u: UnidadFlota): void {
    if (u.estado === 'Baja') return;
    if (u.estado === 'En Taller') {
      this.unidadRetorno.set(u);
    } else {
      this.unidadLiberar.set(u);
    }
  }

  protected abrirLiberarServicio(u: UnidadFlota): void {
    this.unidadLiberar.set(u);
  }

  protected onNuevaUnidad(): void {
    this.showNueva.set(false);
    this.cargarFlota();
  }

  protected onEditarUnidad(): void {
    this.unidadEditar.set(null);
    this.cargarFlota();
  }

  protected onConfirmarLiberar(): void {
    const u = this.unidadLiberar();
    if (!u) return;
    this.unidadLiberar.set(null);
    this.cargarFlota();
    this.exitoLiberar.set(u.id);
  }

  protected onConfirmarRetorno(): void {
    const u = this.unidadRetorno();
    if (!u) return;
    this.unidadRetorno.set(null);
    this.cargarFlota();
    this.exitoRetorno.set(u.id);
  }

  protected darDeBaja(id: string): void {
    const idNumerico = parseInt(id.split('-')[1], 10);
    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.flotaSvc.actualizarEstadoGrua(idNumerico, 'INACTIVO').subscribe({
      next: result => {
        this.guardando.set(false);
        if (result.exitoso === 0) { this.errorGuardar.set(result.mensaje); return; }
        this.cargarFlota();
        this.exitoBaja.set(id);
      },
      error: () => { this.guardando.set(false); this.errorGuardar.set('Error inesperado. Intente nuevamente.'); },
    });
  }

  protected reactivar(id: string): void {
    const idNumerico = parseInt(id.split('-')[1], 10);
    this.flotaSvc.actualizarEstadoGrua(idNumerico, 'ACTIVO').subscribe({
      next: result => {
        if (result.exitoso === 1) {
          this.cargarFlota();
          this.exitoReactivar.set(id);
        }
      },
      error: () => {},
    });
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
