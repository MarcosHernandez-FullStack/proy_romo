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
  X,
  CheckCircle,
  FileText,
  DollarSign,
} from 'lucide-angular';
import { ServicioService } from '../../../core/services/servicio.service';
import { DetalleServicio, EstadoAdmin, EstadoOperativo, Servicio } from '../../../models/servicio.model';

@Component({
  selector: 'app-mis-servicios',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './mis-servicios.html',
})
export class MisServiciosComponent implements OnInit {
  private readonly servicioSvc = inject(ServicioService);

  protected readonly SearchIcon = Search;
  protected readonly DownloadIcon = Download;
  protected readonly EyeIcon = Eye;
  protected readonly CarIcon = Car;
  protected readonly ChevronDownIcon = ChevronDown;
  protected readonly ChevronUpIcon = ChevronUp;
  protected readonly XIcon = X;
  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly FileTextIcon = FileText;
  protected readonly DollarSignIcon = DollarSign;

  protected readonly servicios = signal<Servicio[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly fechaDesde = signal('');
  protected readonly fechaHasta = signal('');

  protected readonly detalle = signal<DetalleServicio | null>(null);
  protected readonly showDetalle = signal(false);
  protected readonly detalleLoading = signal(false);

  // Dropdowns de filtro
  protected readonly filtroOpOpen = signal(false);
  protected readonly filtroAdminOpen = signal(false);
  protected readonly filtroOp = signal<Set<EstadoOperativo>>(new Set());
  protected readonly filtroAdmin = signal<Set<EstadoAdmin>>(new Set());

  protected readonly estadosOp: EstadoOperativo[] = ['Reservado', 'Asignado', 'En Curso', 'Finalizado'];
  protected readonly estadosAdmin: EstadoAdmin[] = ['Pendiente', 'Facturado', 'Pagado'];

  protected readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const opFilter = this.filtroOp();
    const adminFilter = this.filtroAdmin();
    return this.servicios().filter((s) => {
      const matchQ = !q || s.id.toLowerCase().includes(q) || s.origen.toLowerCase().includes(q) || s.destino.toLowerCase().includes(q);
      const matchOp = opFilter.size === 0 || opFilter.has(s.estadoOperativo);
      const matchAdmin = adminFilter.size === 0 || adminFilter.has(s.estadoAdmin);
      return matchQ && matchOp && matchAdmin;
    });
  });

  // KPIs
  protected readonly totalServicios = computed(() => this.servicios().length);
  protected readonly enOperacion = computed(
    () => this.servicios().filter((s) => s.estadoOperativo === 'Asignado' || s.estadoOperativo === 'En Curso').length
  );
  protected readonly montoPendiente = computed(() =>
    this.servicios()
      .filter((s) => s.estadoAdmin === 'Pendiente' || s.estadoAdmin === 'Facturado')
      .reduce((sum, s) => sum + s.costo, 0)
  );
  protected readonly montoLiquidado = computed(() =>
    this.servicios()
      .filter((s) => s.estadoAdmin === 'Pagado')
      .reduce((sum, s) => sum + s.costo, 0)
  );

  ngOnInit(): void {
    // TODO: reemplazar con this.servicioSvc.getServicios().subscribe(...)
    this.servicioSvc.getServicios().subscribe((data) => this.servicios.set(data));
  }

  protected verDetalle(id: string): void {
    this.detalleLoading.set(true);
    this.showDetalle.set(true);
    // TODO: reemplazar con this.servicioSvc.getDetalle(id).subscribe(...)
    this.servicioSvc.getDetalle(id).subscribe((data) => {
      this.detalle.set(data);
      this.detalleLoading.set(false);
    });
  }

  protected cerrarDetalle(): void {
    this.showDetalle.set(false);
    this.detalle.set(null);
  }

  protected vehiculosLabel(n: number): string {
    if (n === 1) return '1 Vehículo';
    if (n >= 3) return `${n} Vehículos`;
    return `${n} Vehículos`;
  }

  protected estadoOpClass(estado: EstadoOperativo): string {
    switch (estado) {
      case 'Finalizado': return 'text-[#008236]';
      case 'En Curso': return 'text-[#ca3500]';
      case 'Asignado': return 'text-[#1447e6]';
      case 'Reservado': return 'text-[#bb4d00]';
    }
  }

  protected estadoOpDotColor(estado: EstadoOperativo): string {
    switch (estado) {
      case 'Finalizado': return '#00c950';
      case 'En Curso': return '#ff6900';
      case 'Asignado': return '#2b7fff';
      case 'Reservado': return '#ffb900';
    }
  }

  protected estadoAdminClass(estado: EstadoAdmin): { bg: string; border: string; text: string } {
    switch (estado) {
      case 'Pagado': return { bg: '#f0fdf4', border: '#b9f8cf', text: '#008236' };
      case 'Facturado': return { bg: '#eff6ff', border: '#bedbff', text: '#1447e6' };
      case 'Pendiente': return { bg: '#fffbeb', border: '#ffd230', text: '#bb4d00' };
    }
  }

  protected formatCosto(n: number): string {
    return '$' + n.toLocaleString('es-AR');
  }

  protected trazabilidadColor(color: 'green' | 'blue' | 'orange'): string {
    switch (color) {
      case 'green': return '#00a63e';
      case 'blue': return '#155dfc';
      case 'orange': return '#ff6900';
    }
  }

  protected toggleFiltroOp(estado: EstadoOperativo): void {
    this.filtroOp.update((set) => {
      const next = new Set(set);
      next.has(estado) ? next.delete(estado) : next.add(estado);
      return next;
    });
  }

  protected toggleFiltroAdmin(estado: EstadoAdmin): void {
    this.filtroAdmin.update((set) => {
      const next = new Set(set);
      next.has(estado) ? next.delete(estado) : next.add(estado);
      return next;
    });
  }
}
