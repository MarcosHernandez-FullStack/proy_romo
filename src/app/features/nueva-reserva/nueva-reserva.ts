import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Phone } from 'lucide-angular';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { ClienteB2B, SlotAdmin } from '../../models/admin.model';
import { TipoCargaComponent, TipoCarga } from './tipo-carga/tipo-carga';
import { SeleccionClienteComponent } from './seleccion-cliente/seleccion-cliente';
import { SeleccionAgendaComponent, FechaItem } from './seleccion-agenda/seleccion-agenda';
import { DetallesVehiculoComponent, VehiculoDetalle } from './detalles-vehiculo/detalles-vehiculo';
import { ConfirmacionReservaComponent, DatosReserva } from './confirmacion-reserva/confirmacion-reserva';
import { ReservaExitosaComponent } from './reserva-exitosa/reserva-exitosa';
import { MensajeModalComponent, MensajeModalTipo } from '../../shared/components/mensaje-modal/mensaje-modal';

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
  private readonly authSvc  = inject(AuthService);
  private readonly http     = inject(HttpClient);

  /** Sesión activa: cliente vía AuthService, admin vía AdminService */
  private readonly activeSession = () => this.authSvc.session() ?? this.adminSvc.session();

  protected readonly PhoneIcon = Phone;

  protected readonly clientes = signal<ClienteB2B[]>([]);

  protected readonly modoCliente = computed(() => this.activeSession()?.rol === 'CLIENTE');

  protected readonly tipoCarga = signal<TipoCarga>('estandar');
  protected readonly cantidadVehiculos = signal(2);
  protected readonly capacidadEfectiva = computed(() =>
    this.tipoCarga() === 'estandar' ? 1 : this.cantidadVehiculos()
  );
  protected readonly clienteId = signal('');
  protected readonly origen = signal('');
  protected readonly destino = signal('');

  protected readonly clienteSeleccionado = computed(() =>
    this.clientes().find((c) => c.id === this.clienteId()) ?? null
  );

  protected readonly today = new Date();
  protected readonly fechas = computed<FechaItem[]>(() => {
    const arr: FechaItem[] = [];
    for (let i = 0; i < 365; i++) {
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

  private readonly rutaData = signal<{ distanciaKm: number; tiempoMin: number; coordLatOrigen: string; coordLonOrigen: string; coordLatDestino: string; coordLonDestino: string } | null>(null);
  protected readonly distanciaKm    = computed(() => this.rutaData()?.distanciaKm    ?? 0);
  protected readonly tiempoMin      = computed(() => this.rutaData()?.tiempoMin      ?? 0);
  protected readonly coordLatOrigen  = computed(() => this.rutaData()?.coordLatOrigen  ?? '0');
  protected readonly coordLonOrigen  = computed(() => this.rutaData()?.coordLonOrigen  ?? '0');
  protected readonly coordLatDestino = computed(() => this.rutaData()?.coordLatDestino ?? '0');
  protected readonly coordLonDestino = computed(() => this.rutaData()?.coordLonDestino ?? '0');
  protected readonly margenManiobra = 30;
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
    return Math.max(25, +(this.distanciaKm() * this.tarifaEfectivaKm()).toFixed(2));
  });

  protected readonly mensajeExcepcion = computed(() => {
    const horas = this.horaExcepcionPend();
    const lista = horas.map(h => `• ${h}`).join('\n');
    return `Los siguientes horarios del bloque seleccionado están marcados como excepción:\n${lista}\n\n` +
      `Estos horarios normalmente no se trabajan y están disponibles únicamente para casos de emergencia. ` +
      `¿Está seguro que desea continuar con esta reserva?`;
  });

  protected readonly conflictoBloque    = signal<string | null>(null);
  protected readonly showConfirm        = signal(false);
  protected readonly showSuccess        = signal(false);
  protected readonly servicioCreado     = signal('');
  protected readonly confirmExcepcion   = signal(false);
  protected readonly horaExcepcionPend  = signal<string[]>([]);

  // Wizard state
  protected readonly currentStep = signal(0);
  protected readonly stepLabels = ['Tipo de Carga', 'Cliente y Ruta', 'Fecha y Horario', 'Detalles de Vehículo'];

  // Tipo de horario del slot seleccionado ('disponible' | 'excepcion')
  protected readonly tipoHorarioSel = signal<string>('disponible');

  protected readonly datosReserva = computed<DatosReserva>(() => ({
    cliente: this.clienteSeleccionado()?.empresa
      ?? (this.modoCliente() ? (this.activeSession()?.empresa ?? '') : ''),
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
    costoTotal:   this.costoTotal(),
    tarifaKm:     this.tarifaEfectivaKm(),
    tipoHorario:    this.tipoHorarioSel(),
    horasExcepcion: this.slots()
      .filter(s => (s.estado === 'seleccionado' || s.estado === 'rango') && s.estadoOriginal === 'excepcion')
      .map(s => s.hora),
  }));

  protected onTarifaChange(data: { tarifaKm: number; tarifaBase: number } | null): void {
    this.tarifaData.set(data);
  }

  protected onParametroChange(data: { tiempoMargenManiobra: number; tiempoRetornoBase: number; timerAdministrativo: number; timerCliente: number } | null): void {
    this.parametroData.set(data);
  }

  protected onValidarHorario(): void {
    // Para slots de excepción, pedir confirmación antes de validar
    if (this.tipoHorarioSel() === 'excepcion') {
      const excepcionHoras = this.slots()
        .filter(s => (s.estado === 'seleccionado' || s.estado === 'rango') && s.estadoOriginal === 'excepcion')
        .map(s => s.hora);
      this.horaExcepcionPend.set(excepcionHoras);
      this.confirmExcepcion.set(true);
      return;
    }
    this.ejecutarValidacion();
  }

  protected onConfirmarExcepcion(): void {
    this.confirmExcepcion.set(false);
    this.ejecutarValidacion();
  }

  private ejecutarValidacion(): void {
    const session   = this.activeSession();
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
      fechaServicio:        `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`,
      horaInicio:           `${slotSel.hora}:00`,
      horaFin,
      cantidadCarga:        this.capacidadEfectiva(),
      rol:                  session.rol,
      idCliente:            session.idCliente ?? parseInt(this.clienteId()),
      idOperador:           null as number | null,
      direccionOrigen:      this.origen(),
      coordLatOrigen:       this.coordLatOrigen(),
      coordLonOrigen:       this.coordLonOrigen(),
      direccionDestino:     this.destino(),
      coordLatDestino:      this.coordLatDestino(),
      coordLonDestino:      this.coordLonDestino(),
      distanciaKm:          this.distanciaKm(),
      tiempoEstimado:       this.tiempoMin(),
      tiempoManiobra:       parametro.tiempoMargenManiobra,
      tiempoRetorno:        parametro.tiempoRetornoBase,
      nroBloques:           this.bloques(),
      costoKm:              tarifa.tarifaKm,
      costoBase:            tarifa.tarifaBase,
      timerExpiracion,
      creadoPor:            session.id,
      tipoHorario:          this.tipoHorarioSel().toUpperCase(),
      estadoOperacion:      'RESERVADO',
      estadoAdministrativo: 'PENDIENTE',
      estado:               'ACTIVO',
      fechaCreacion:        new Date().toISOString(),
    };

    this.http.post<{ exitoso: number; mensaje: string; horasConflicto: string | null; id: number | null }>(
      `${API}/reservas/validar-horario`,
      dto
    ).subscribe({
      next: result => {
        this.validando.set(false);
        if (result.exitoso === 1) {
          this.idTimerReserva.set(result.id);
          this.horarioValidado.set(true);
        } else {
          const mensaje = result.horasConflicto
            ? `${result.mensaje}\n\nHoras sin disponibilidad: ${result.horasConflicto}`
            : result.mensaje;
          this.modal.set({ tipo: 'error', titulo: 'Horario no disponible', mensaje });
        }
      },
      error: err => {
        this.validando.set(false);
        const body = err.error;
        const base = body?.mensaje ?? (typeof body === 'string' ? body : 'Ocurrió un error inesperado al verificar disponibilidad, intente nuevamente.');
        const mensaje = body?.horasConflicto
          ? `${base}\n\nHoras sin disponibilidad: ${body.horasConflicto}`
          : base;
        this.modal.set({ tipo: 'error', titulo: 'Horario no disponible', mensaje });
      },
    });
  }

  private cargarHorarios(fecha: Date, capacidad: number): void {
    const rol = this.activeSession()?.rol ?? 'ADMINISTRADOR';
    this.adminSvc.getHorarios(fecha, rol, capacidad).subscribe({
      next: (horas) => this.slots.set(
        (horas ?? []).map(h => {
          const esExcepcion = h.estado?.toUpperCase() === 'EXCEPCION';
          const base = esExcepcion ? 'excepcion' as const : 'libre' as const;
          return { hora: h.hora.substring(0, 5), estado: base, estadoOriginal: base };
        })
      ),
      error: () => this.slots.set([]),
    });
  }

  constructor() {
    // Recargar slots cuando cambie la fecha o la cantidad de vehículos
    effect(() => {
      const fecha     = this.fechas()[this.fechaIdx()].date;
      const capacidad = this.capacidadEfectiva();
      this.cargarHorarios(fecha, capacidad);
    });

    // Auto-redirect 3 seg después de creación exitosa
    effect(() => {
      if (this.showSuccess()) {
        setTimeout(() => this.onNuevaReserva(), 3000);
      }
    });
  }

  ngOnInit(): void {
    const session = this.activeSession();
    if (session?.rol === 'CLIENTE' && session.idCliente) {
      this.clienteId.set(String(session.idCliente));
    } else {
      this.adminSvc.getClientes().subscribe((data) => this.clientes.set(data));
    }
  }

  protected onRutaChange(data: { distanciaKm: number; tiempoMin: number; coordLatOrigen: string; coordLonOrigen: string; coordLatDestino: string; coordLonDestino: string } | null): void {
    this.rutaData.set(data);
  }

  protected onSelectFecha(idx: number): void {
    this.fechaIdx.set(idx);
    this.horarioValidado.set(false);
    this.idTimerReserva.set(null);
    this.tipoHorarioSel.set('disponible');
    this.modal.set(null);
  }

  protected onSelectSlot(idx: number): void {
    const s = this.slots()[idx];
    if (s.estado === 'cerrado' || s.estado === 'ocupado' || s.estado === 'bloqueado') return;

    // Click en el inicio o en un bloque de continuación → deseleccionar todo
    if (s.estado === 'seleccionado' || s.estado === 'rango') {
      this.horarioValidado.set(false);
      this.idTimerReserva.set(null);
      this.tipoHorarioSel.set('disponible');
      this.modal.set(null);
      this.conflictoBloque.set(null);
      this.slots.update(prev =>
        prev.map(slot =>
          slot.estado === 'seleccionado' || slot.estado === 'rango'
            ? { ...slot, estado: slot.estadoOriginal ?? 'libre' }
            : slot
        )
      );
      return;
    }

    // Si ya hay una selección activa, bloquear hasta que se desmarca primero
    const yaHaySeleccion = this.slots().some(sl => sl.estado === 'seleccionado');
    if (yaHaySeleccion) return;

    this.horarioValidado.set(false);
    this.idTimerReserva.set(null);
    this.modal.set(null);
    this.conflictoBloque.set(null);

    // Calcular las horas requeridas para los N-1 bloques siguientes
    const bloques      = this.bloques();
    const horaInicio   = parseInt(s.hora.split(':')[0]);
    const horasRestantes = Array.from({ length: bloques - 1 }, (_, i) => {
      const h = (horaInicio + i + 1) % 24;
      return `${String(h).padStart(2, '0')}:00`;
    });

    // Verificar que todos los bloques siguientes estén disponibles
    const currentSlots   = this.slots();
    const indicesRestantes = horasRestantes.map(hora =>
      currentSlots.findIndex(sl => sl.hora === hora && (sl.estado === 'libre' || sl.estado === 'excepcion'))
    );

    if (indicesRestantes.some(i => i === -1)) {
      this.conflictoBloque.set(`No hay ${bloques} bloques consecutivos disponibles desde ${s.hora}`);
      return;
    }
    this.conflictoBloque.set(null);

    // Determinar tipo: excepción si el inicio O cualquier continuación es excepción
    const algunaExcepcion = s.estado === 'excepcion' ||
      indicesRestantes.some(i => currentSlots[i]?.estadoOriginal === 'excepcion');
    this.tipoHorarioSel.set(algunaExcepcion ? 'excepcion' : 'disponible');

    this.slots.update(prev =>
      prev.map((slot, i) => {
        if (i === idx)                    return { ...slot, estado: 'seleccionado' as const };
        if (indicesRestantes.includes(i)) return { ...slot, estado: 'rango' as const };
        return slot;
      })
    );
  }

  protected onEditar(): void {
    const timerId = this.idTimerReserva();
    if (timerId) {
      this.adminSvc.deleteTimer(timerId).subscribe();
    }
    this.horarioValidado.set(false);
    this.idTimerReserva.set(null);
  }

  protected onVehiculosConfirmados(vehiculos: VehiculoDetalle[]): void {
    this.vehiculosData.set(vehiculos);
    this.showConfirm.set(true);
  }

  protected onConfirmarReserva(): void {
    const session  = this.activeSession();
    const timerId  = this.idTimerReserva();
    if (!session || !timerId) return;

    this.showConfirm.set(false);

    const dto = {
      idTimerReserva: timerId,
      rol:            session.rol,
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
          this.modal.set({ tipo: 'error', titulo: 'Error al Guardar Reserva', mensaje: result.mensaje });
        }
      },
      error: err => {
        const msg = err.error;
        this.modal.set({
          tipo: 'error',
          titulo: 'Error al Guardar Reserva',
          mensaje: typeof msg === 'string' ? msg : 'Ocurrió un error inesperado al guardar la reserva.',
        });
      },
    });
  }

  protected onNuevaReserva(): void {
    this.showSuccess.set(false);
    this.currentStep.set(0);
    this.tipoCarga.set('estandar');
    this.cantidadVehiculos.set(2);
    this.clienteId.set('');
    this.origen.set('');
    this.destino.set('');
    this.vehiculosData.set([]);
    this.horarioValidado.set(false);
    this.tipoHorarioSel.set('disponible');
    this.cargarHorarios(this.today, this.capacidadEfectiva());
  }

  // Wizard navigation
  protected goNext(): void {
    // Al pasar de Cliente y Ruta → Fecha y Horario, reiniciar agenda
    if (this.currentStep() === 1) {
      this.fechaIdx.set(0);
      this.horarioValidado.set(false);
      this.tipoHorarioSel.set('disponible');
      this.modal.set(null);
      this.conflictoBloque.set(null);
      this.cargarHorarios(this.fechas()[0].date, this.capacidadEfectiva());
    }
    this.currentStep.update(s => Math.min(s + 1, 3));
  }

  protected goPrev(): void {
    if (this.currentStep() === 2) {
      this.onEditar();
    }
    this.currentStep.update(s => Math.max(s - 1, 0));
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
