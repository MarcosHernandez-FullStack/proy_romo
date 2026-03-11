import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Phone } from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { ClienteB2B, SlotAdmin } from '../../../models/admin.model';
import { TipoCargaComponent, TipoCarga } from './tipo-carga/tipo-carga';
import { SeleccionClienteComponent } from './seleccion-cliente/seleccion-cliente';
import { SeleccionAgendaComponent, FechaItem } from './seleccion-agenda/seleccion-agenda';
import { DetallesVehiculoComponent, VehiculoDetalle } from './detalles-vehiculo/detalles-vehiculo';
import { ConfirmacionReservaComponent, DatosReserva } from './confirmacion-reserva/confirmacion-reserva';
import { ReservaExitosaComponent } from './reserva-exitosa/reserva-exitosa';
import { MensajeModalComponent, MensajeModalTipo } from '../../../shared/components/mensaje-modal/mensaje-modal';

const API = 'http://localhost:5016/api';

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
    MensajeModalComponent,
  ],
  templateUrl: './nueva-reserva.html',
})
export class NuevaReservaComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly http     = inject(HttpClient);

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
  protected readonly horarioValidado  = signal(false);
  protected readonly idTimerReserva   = signal<number | null>(null);
  protected readonly validando        = signal(false);
  protected readonly modal = signal<{ tipo: MensajeModalTipo; titulo: string; mensaje: string } | null>(null);

  private readonly tarifaData    = signal<{ tarifaKm: number; tarifaBase: number } | null>(null);
  private readonly parametroData = signal<{
    tiempoMargenManiobra: number;
    tiempoRetornoBase:    number;
    timerAdministrativo: number;
    timerCliente:        number;
  } | null>(null);

  private readonly vehiculosData = signal<VehiculoDetalle[]>([]);

  private readonly rutaData = signal<{ distanciaKm: number; tiempoMin: number } | null>(null);
  protected readonly distanciaKm = computed(() => this.rutaData()?.distanciaKm ?? 0);
  protected readonly tiempoMin   = computed(() => this.rutaData()?.tiempoMin   ?? 0);
  protected readonly margenManiobra = 30; // fallback hasta que cargue parametroData
  protected readonly bloques = computed(() => {
    const margen = this.parametroData()?.tiempoMargenManiobra ?? this.margenManiobra;
    return Math.max(1, Math.ceil((this.tiempoMin() + margen) / 60));
  });
  protected readonly tarifaEfectivaKm = computed(() => {
    const t = this.tarifaData();
    return t ? t.tarifaKm + t.tarifaBase : 0;
  });

  protected readonly costoTotal = computed(() => {
    if (!this.tarifaData() || this.distanciaKm() === 0) return 0;
    return Math.max(25, +(this.distanciaKm() * this.tarifaEfectivaKm()).toFixed(0));
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
    tipoCarga: this.tipoCarga() === 'estandar'
      ? 'Estándar (1 vehículo)'
      : `Múltiple (${this.cantidadVehiculos()} vehículos)`,
    vehiculos: this.vehiculosData().map(v => ({
      tipo:        v.tipo,
      placa:       v.placa,
      descripcion: v.descripcion,
    })),
    distanciaKm: this.distanciaKm(),
    tiempoMin: this.tiempoMin(),
    margenManiobra: this.parametroData()?.tiempoMargenManiobra ?? this.margenManiobra,
    bloques: this.bloques(),
    costoTotal: this.costoTotal(),
    tarifaKm: this.tarifaEfectivaKm(),
  }));

  protected onTarifaChange(data: { tarifaKm: number; tarifaBase: number } | null): void {
    this.tarifaData.set(data);
  }

  protected onParametroChange(data: { tiempoMargenManiobra: number; tiempoRetornoBase: number; timerAdministrativo: number; timerCliente: number } | null): void {
    this.parametroData.set(data);
  }

  protected onValidarHorario(): void {
    const session   = this.adminSvc.session();
    const tarifa    = this.tarifaData();
    const parametro = this.parametroData();
    const slotSel   = this.slots().find(s => s.estado === 'seleccionado');

    if (!session || !tarifa || !parametro || !slotSel) return;

    this.validando.set(true);
    this.modal.set(null);

    const fecha      = this.fechas()[this.fechaIdx()].date;
    const horaInicioH = parseInt(slotSel.hora.split(':')[0]);
    const horaFinH   = (horaInicioH + this.bloques()) % 24;
    const horaFin    = `${String(horaFinH).padStart(2, '0')}:00:00`;

    const timerExpiracion = session.rol === 'ADMINISTRADOR'
      ? parametro.timerAdministrativo
      : parametro.timerCliente;

    const dto = {
      fechaServicio:        fecha.toISOString().split('T')[0],
      horaInicio:           `${slotSel.hora}:00`,
      horaFin,
      cantidadCarga:        this.cantidadVehiculos(),
      idCliente:            parseInt(this.clienteId()),
      idOperador:           null as number | null,
      direccionOrigen:      this.origen(),
      coordLatOrigen:       '0',
      coordLonOrigen:       '0',
      direccionDestino:     this.destino(),
      coordLatDestino:      '0',
      coordLonDestino:      '0',
      distanciaKm:          this.distanciaKm(),
      tiempoEstimado:       this.tiempoMin(),
      tiempoManiobra:       parametro.tiempoMargenManiobra,
      tiempoRetorno:        parametro.tiempoRetornoBase,
      nroBloques:           this.bloques(),
      costoKm:              tarifa.tarifaKm,
      costoBase:            tarifa.tarifaBase,
      timerExpiracion,
      creadoPor:            session.id,
      estadoOperacion:      'RESERVADO',
      estadoAdministrativo: 'PENDIENTE',
      estado:               'ACTIVO',
    };

    this.http.post<{ exitoso: number; mensaje: string; id: number | null }>(
      `${API}/reservas/validar-horario`,
      dto
    ).subscribe({
      next: result => {
        this.validando.set(false);
        if (result.exitoso === 1) {
          this.idTimerReserva.set(result.id);
          this.horarioValidado.set(true);
        } else {
          this.modal.set({ tipo: 'error', titulo: 'Horario no disponible', mensaje: result.mensaje });
        }
      },
      error: err => {
        this.validando.set(false);
        const msg = err.error;
        this.modal.set({
          tipo: 'error',
          titulo: 'Error al validar',
          mensaje: typeof msg === 'string' ? msg : 'Ocurrió un error inesperado al validar el horario.',
        });
      },
    });
  }

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
    this.idTimerReserva.set(null);
    this.modal.set(null);
    this.cargarHorarios(this.fechas()[idx].date);
  }

  protected onSelectSlot(idx: number): void {
    const s = this.slots()[idx];
    if (s.estado === 'cerrado' || s.estado === 'ocupado' || s.estado === 'bloqueado') return;

    this.horarioValidado.set(false);
    this.idTimerReserva.set(null);
    this.modal.set(null);

    // Click en el inicio o en un bloque de continuación → deseleccionar todo
    if (s.estado === 'seleccionado' || s.estado === 'rango') {
      this.slots.update(prev =>
        prev.map(slot =>
          slot.estado === 'seleccionado' || slot.estado === 'rango'
            ? { ...slot, estado: 'libre' as const }
            : slot
        )
      );
      return;
    }

    // Calcular las horas requeridas para los N-1 bloques siguientes
    const bloques      = this.bloques();
    const horaInicio   = parseInt(s.hora.split(':')[0]);
    const horasRestantes = Array.from({ length: bloques - 1 }, (_, i) => {
      const h = (horaInicio + i + 1) % 24;
      return `${String(h).padStart(2, '0')}:00`;
    });

    // Verificar que todos los bloques siguientes estén disponibles en la lista
    const currentSlots   = this.slots();
    const indicesRestantes = horasRestantes.map(hora =>
      currentSlots.findIndex(sl => sl.hora === hora && sl.estado === 'libre')
    );

    if (indicesRestantes.some(i => i === -1)) return; // No hay N bloques consecutivos libres

    // Marcar selección (reseteando la selección anterior si existe)
    this.slots.update(prev =>
      prev.map((slot, i) => {
        if (slot.estado === 'seleccionado' || slot.estado === 'rango') return { ...slot, estado: 'libre' as const };
        if (i === idx)                    return { ...slot, estado: 'seleccionado' as const };
        if (indicesRestantes.includes(i)) return { ...slot, estado: 'rango' as const };
        return slot;
      })
    );
  }

  protected onVehiculosConfirmados(vehiculos: VehiculoDetalle[]): void {
    this.vehiculosData.set(vehiculos);
    this.showConfirm.set(true);
  }

  protected onConfirmarReserva(): void {
    const session  = this.adminSvc.session();
    const timerId  = this.idTimerReserva();
    if (!session || !timerId) return;

    this.showConfirm.set(false);

    const dto = {
      idTimerReserva: timerId,
      actualizadoPor: session.id,
      vehiculos: this.vehiculosData().map(v => ({
        tipo:        v.tipo,
        placa:       v.placa,
        descripcion: v.descripcion,
        observacion: v.observaciones,
      })),
    };

    this.http.post<{ exitoso: number; mensaje: string; id: number | null }>(
      `${API}/reservas/crear-reserva`,
      dto
    ).subscribe({
      next: result => {
        if (result.exitoso === 1) {
          this.servicioCreado.set(`SRV-${result.id ?? ''}`);
          this.showSuccess.set(true);
        } else {
          this.modal.set({ tipo: 'error', titulo: 'Error al confirmar', mensaje: result.mensaje });
        }
      },
      error: err => {
        const msg = err.error;
        this.modal.set({
          tipo: 'error',
          titulo: 'Error al confirmar',
          mensaje: typeof msg === 'string' ? msg : 'Ocurrió un error inesperado al crear la reserva.',
        });
      },
    });
  }

  protected onNuevaReserva(): void {
    this.showSuccess.set(false);
    this.tipoCarga.set('estandar');
    this.cantidadVehiculos.set(2);
    this.clienteId.set('');
    this.origen.set('');
    this.destino.set('');
    this.vehiculosData.set([]);
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
