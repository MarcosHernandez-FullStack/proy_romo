import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LucideAngularModule, Phone } from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { ClienteB2B, SlotAdmin } from '../../../models/admin.model';
import { TipoCargaComponent, TipoCarga } from './tipo-carga/tipo-carga';
import { SeleccionClienteComponent } from './seleccion-cliente/seleccion-cliente';
import { SeleccionAgendaComponent, FechaItem } from './seleccion-agenda/seleccion-agenda';
import { DetallesVehiculoComponent } from './detalles-vehiculo/detalles-vehiculo';
import { ConfirmacionReservaComponent, DatosReserva } from './confirmacion-reserva/confirmacion-reserva';
import { ReservaExitosaComponent } from './reserva-exitosa/reserva-exitosa';

@Component({
  selector: 'app-nueva-reserva',
  standalone: true,
  imports: [
    LucideAngularModule,
    TipoCargaComponent,
    SeleccionClienteComponent,
    SeleccionAgendaComponent,
    DetallesVehiculoComponent,
    ConfirmacionReservaComponent,
    ReservaExitosaComponent,
  ],
  templateUrl: './nueva-reserva.html',
})
export class NuevaReservaComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly PhoneIcon = Phone;

  protected readonly clientes = signal<ClienteB2B[]>([]);

  protected readonly tipoCarga = signal<TipoCarga>('estandar');
  protected readonly cantidadVehiculos = signal(2);
  protected readonly clienteId = signal('');
  protected readonly origen = signal('');
  protected readonly destino = signal('');

  protected readonly clienteSeleccionado = computed(() =>
    this.clientes().find((c) => c.id === this.clienteId()) ?? null
  );

  protected readonly today = new Date();
  protected readonly fechas = computed<FechaItem[]>(() => {
    const arr: FechaItem[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.today);
      d.setDate(d.getDate() + i);
      arr.push({
        label: d.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase(),
        dia: String(d.getDate()),
        mes: d.toLocaleDateString('es-AR', { month: 'short' }),
        date: d,
      });
    }
    return arr;
  });

  protected readonly fechaIdx = signal(0);
  protected readonly fechaLabel = computed(() => {
    const d = this.fechas()[this.fechaIdx()].date;
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  });

  protected readonly slots = signal<SlotAdmin[]>([]);
  protected readonly horarioValidado = signal(false);

  protected readonly tipoVehiculo = signal('');
  protected readonly detallesVehiculo = signal('');
  protected readonly observaciones = signal('');

  private readonly rutaData = signal<{ distanciaKm: number; tiempoMin: number } | null>(null);
  protected readonly distanciaKm = computed(() => this.rutaData()?.distanciaKm ?? 0);
  protected readonly tiempoMin   = computed(() => this.rutaData()?.tiempoMin   ?? 0);
  protected readonly margenManiobra = 30;
  protected readonly bloques = computed(() =>
    Math.max(1, Math.ceil((this.tiempoMin() + this.margenManiobra) / 60))
  );
  protected readonly costoTotal = computed(() => {
    const c = this.clienteSeleccionado();
    if (!c || this.distanciaKm() === 0) return 0;
    return Math.max(25, +(this.distanciaKm() * c.tarifaKm).toFixed(0));
  });

  protected readonly showConfirm = signal(false);
  protected readonly showSuccess = signal(false);
  protected readonly servicioCreado = signal('');

  protected readonly datosReserva = computed<DatosReserva>(() => ({
    cliente: this.clienteSeleccionado()?.empresa ?? '',
    origen: this.origen(),
    destino: this.destino(),
    fechaLabel: this.fechaLabel(),
    horaSlot: this.slots().find((s) => s.estado === 'seleccionado')?.hora ?? '',
    tipoVehiculo: this.tipoVehiculo(),
    tipoCarga: this.tipoCarga() === 'estandar'
      ? 'Estándar (1 vehículo)'
      : `Múltiple (${this.cantidadVehiculos()} vehículos)`,
    distanciaKm: this.distanciaKm(),
    tiempoMin: this.tiempoMin(),
    margenManiobra: this.margenManiobra,
    bloques: this.bloques(),
    costoTotal: this.costoTotal(),
    tarifaKm: this.clienteSeleccionado()?.tarifaKm ?? 0,
  }));

  private cargarHorarios(fecha: Date): void {
    const rol = this.adminSvc.session()?.rol ?? 'ADMINISTRADOR';
    this.adminSvc.getHorariosDisponibles(fecha, rol).subscribe({
      next: (horas) => this.slots.set(
        (horas ?? []).map(h => ({ hora: h.horaDisponible.substring(0, 5), estado: 'libre' as const }))
      ),
      error: () => this.slots.set([]),
    });
  }

  ngOnInit(): void {
    this.adminSvc.getClientes().subscribe((data) => this.clientes.set(data));
    this.cargarHorarios(this.today);
  }

  protected onRutaChange(data: { distanciaKm: number; tiempoMin: number } | null): void {
    this.rutaData.set(data);
  }

  protected onSelectFecha(idx: number): void {
    this.fechaIdx.set(idx);
    this.horarioValidado.set(false);
    this.cargarHorarios(this.fechas()[idx].date);
  }

  protected onSelectSlot(idx: number): void {
    const s = this.slots()[idx];
    if (s.estado === 'cerrado' || s.estado === 'ocupado' || s.estado === 'bloqueado') return;
    this.horarioValidado.set(false);
    this.slots.update((prev) =>
      prev.map((slot, i) => ({
        ...slot,
        estado: slot.estado === 'seleccionado' ? 'libre' : i === idx ? 'seleccionado' : slot.estado,
      }))
    );
  }

  protected onConfirmarReserva(): void {
    this.showConfirm.set(false);
    const num = Math.floor(Math.random() * 900) + 100;
    this.servicioCreado.set(`SRV-${num}`);
    this.showSuccess.set(true);
  }

  protected onNuevaReserva(): void {
    this.showSuccess.set(false);
    this.tipoCarga.set('estandar');
    this.cantidadVehiculos.set(2);
    this.clienteId.set('');
    this.origen.set('');
    this.destino.set('');
    this.tipoVehiculo.set('');
    this.detallesVehiculo.set('');
    this.observaciones.set('');
    this.horarioValidado.set(false);
    this.cargarHorarios(this.today);
  }

  protected readonly step0Complete = computed(() =>
    this.tipoCarga() === 'estandar' ||
    (this.tipoCarga() === 'multiple' && this.cantidadVehiculos() >= 2)
  );

  protected readonly step1Complete = computed(() =>
    !!this.clienteId() && !!this.origen() && !!this.destino()
  );

  protected readonly step2Complete = computed(() => this.horarioValidado());
}
