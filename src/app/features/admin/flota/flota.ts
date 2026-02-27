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
} from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { EstadoUnidad, UnidadFlota } from '../../../models/admin.model';
import { NuevaUnidadComponent } from './nueva-unidad/nueva-unidad';
import { EditarUnidadComponent } from './editar-unidad/editar-unidad';
import { DetalleUnidadComponent } from './detalle-unidad/detalle-unidad';

type FiltroFlota = 'Activas' | 'En Taller' | 'Bajas';

@Component({
  selector: 'app-flota',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, NuevaUnidadComponent, EditarUnidadComponent, DetalleUnidadComponent],
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
  protected readonly TagIcon = Tag;
  protected readonly Users2Icon = Users2;

  protected readonly flota = signal<UnidadFlota[]>([]);
  protected readonly filtroFlota = signal<FiltroFlota>('Activas');
  protected readonly filtrosFlota: FiltroFlota[] = ['Activas', 'En Taller', 'Bajas'];
  protected readonly busqueda = signal('');

  protected readonly showNueva = signal(false);
  protected readonly unidadEditar = signal<UnidadFlota | null>(null);
  protected readonly unidadDetalle = signal<UnidadFlota | null>(null);

  protected readonly totalUnidades = computed(() => this.flota().length);
  protected readonly operativas = computed(() => this.flota().filter((u) => u.estado === 'Operativa').length);
  protected readonly enTaller = computed(() => this.flota().filter((u) => u.estado === 'En Taller').length);
  protected readonly segurosCriticos = computed(() => {
    const limite = Date.now() + 30 * 24 * 60 * 60 * 1000;
    return this.flota().filter((u) => u.vencimientoSeguro && new Date(u.vencimientoSeguro).getTime() < limite).length;
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
    this.adminSvc.getFlota().subscribe((data) => this.flota.set(data));
  }

  protected onNuevaUnidad(data: Omit<UnidadFlota, 'id'>): void {
    const id = `UNI-${String(this.flota().length + 1).padStart(3, '0')}`;
    this.flota.update((prev) => [...prev, { ...data, id }]);
    this.showNueva.set(false);
  }

  protected onEditarUnidad(data: UnidadFlota): void {
    this.flota.update((prev) => prev.map((u) => (u.id === data.id ? data : u)));
    this.unidadEditar.set(null);
  }

  protected darDeBaja(id: string): void {
    this.flota.update((prev) => prev.map((u) => (u.id === id ? { ...u, estado: 'Baja' as EstadoUnidad } : u)));
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
