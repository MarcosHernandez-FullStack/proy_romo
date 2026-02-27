import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  LucideAngularModule,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Users,
  Pencil,
  XCircle,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { EstadoServicioAdmin, Operador, ServicioAdmin } from '../../../models/admin.model';
import { AsignarServicioComponent, AsignacionData } from './asignar-servicio/asignar-servicio';
import { CancelarServicioComponent } from './cancelar-servicio/cancelar-servicio';
import { ReprogramarServicioComponent } from './reprogramar-servicio/reprogramar-servicio';

type FiltroTab = 'Reservado' | 'Asignado' | 'En Curso';

@Component({
  selector: 'app-operaciones',
  standalone: true,
  imports: [
    LucideAngularModule,
    AsignarServicioComponent,
    CancelarServicioComponent,
    ReprogramarServicioComponent,
  ],
  templateUrl: './operaciones.html',
})
export class OperacionesComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly CheckCircle2Icon = CheckCircle2;
  protected readonly TruckIcon = Truck;
  protected readonly UsersIcon = Users;
  protected readonly PencilIcon = Pencil;
  protected readonly XCircleIcon = XCircle;
  protected readonly CalendarIcon = Calendar;
  protected readonly MapPinIcon = MapPin;
  protected readonly ClockIcon = Clock;

  protected readonly servicios = signal<ServicioAdmin[]>([]);
  protected readonly operadores = signal<Operador[]>([]);
  protected readonly filtroTab = signal<FiltroTab>('Reservado');
  protected readonly filtroTabs: FiltroTab[] = ['Reservado', 'Asignado', 'En Curso'];

  // Modal state
  protected readonly showAsignar = signal(false);
  protected readonly servicioAsignar = signal<ServicioAdmin | null>(null);
  protected readonly showCancelar = signal(false);
  protected readonly servicioCancelar = signal<ServicioAdmin | null>(null);
  protected readonly showReprogramar = signal(false);
  protected readonly servicioReprogramar = signal<ServicioAdmin | null>(null);

  protected readonly serviciosFiltrados = computed(() =>
    this.servicios().filter((s) => s.estado === this.filtroTab())
  );

  protected readonly countReservado = computed(() => this.servicios().filter((s) => s.estado === 'Reservado').length);
  protected readonly countAsignado = computed(() => this.servicios().filter((s) => s.estado === 'Asignado').length);
  protected readonly countEnCurso = computed(() => this.servicios().filter((s) => s.estado === 'En Curso').length);
  protected readonly operadoresDisponibles = computed(() => this.operadores().filter((o) => o.activo).length);

  ngOnInit(): void {
    this.adminSvc.getOperaciones().subscribe((data) => this.servicios.set(data));
    this.adminSvc.getOperadores().subscribe((data) => this.operadores.set(data));
  }

  protected abrirAsignar(s: ServicioAdmin): void {
    this.servicioAsignar.set(s);
    this.showAsignar.set(true);
  }

  protected onConfirmarAsignacion(data: AsignacionData): void {
    this.servicios.update((prev) =>
      prev.map((s) =>
        s.id === data.servicioId
          ? { ...s, operador: data.operador, unidad: data.unidad, estado: 'Asignado' as EstadoServicioAdmin }
          : s
      )
    );
    this.showAsignar.set(false);
  }

  protected abrirCancelar(s: ServicioAdmin): void {
    this.servicioCancelar.set(s);
    this.showCancelar.set(true);
  }

  protected onConfirmarCancelacion(id: string): void {
    this.servicios.update((prev) => prev.filter((s) => s.id !== id));
    this.showCancelar.set(false);
  }

  protected abrirReprogramar(s: ServicioAdmin): void {
    this.servicioReprogramar.set(s);
    this.showReprogramar.set(true);
  }

  protected estadoBadgeClass(estado: EstadoServicioAdmin): string {
    switch (estado) {
      case 'Reservado': return 'bg-[#fffbeb] text-[#bb4d00] border border-[#ffd230]';
      case 'Asignado': return 'bg-[#eff6ff] text-[#1447e6] border border-[#bedbff]';
      case 'En Curso': return 'bg-[#fff7ed] text-[#ca3500] border border-[#fdba74]';
      case 'Finalizado': return 'bg-[#f0fdf4] text-[#008236] border border-[#b9f8cf]';
      case 'Cancelado': return 'bg-[#fef2f2] text-[#c10007] border border-[#fca5a5]';
    }
  }
}
