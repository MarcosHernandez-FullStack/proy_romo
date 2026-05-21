import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Calendar,
  CircleCheck,
  CircleX,
  TriangleAlert,
  Clock,
  Truck,
  RefreshCw,
  OctagonAlert,
} from 'lucide-angular';
import { ReservaOperacion } from '../../../../models/operaciones.model';
import { ReservasService } from '../../../../core/services/reservas.service';
import { OperacionesService } from '../../../../core/services/operaciones.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MensajeModalComponent } from '../../../../shared/components/mensaje-modal/mensaje-modal';

interface SlotReprogramar {
  hora:           string;
  estado:         'libre' | 'excepcion' | 'seleccionado' | 'rango';
  estadoOriginal: 'libre' | 'excepcion';
}

export interface ReprogramacionData {
  idReserva:       number;
  nuevaFecha:      string;
  nuevaHoraInicio: string;
}

@Component({
  selector: 'app-reprogramar-servicio',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MensajeModalComponent],
  templateUrl: './reprogramar-servicio.html',
})
export class ReprogramarServicioComponent implements OnInit {
  private readonly reservasSvc    = inject(ReservasService);
  private readonly operacionesSvc = inject(OperacionesService);
  private readonly authSvc        = inject(AuthService);

  readonly reserva   = input.required<ReservaOperacion>();
  readonly confirmar = output<number>();
  readonly cerrar    = output<void>();

  protected readonly CalendarIcon      = Calendar;
  protected readonly CheckCircle2Icon  = CircleCheck;
  protected readonly XCircleIcon       = CircleX;
  protected readonly AlertTriangleIcon = TriangleAlert;
  protected readonly OctagonAlertIcon  = OctagonAlert;
  protected readonly ClockIcon         = Clock;
  protected readonly TruckIcon         = Truck;
  protected readonly RefreshCwIcon     = RefreshCw;

  protected readonly nuevaFecha        = signal('');
  protected readonly cargandoSlots     = signal(false);
  protected readonly guardando         = signal(false);
  protected readonly error             = signal<string | null>(null);
  protected readonly advertencia       = signal<string | null>(null);
  protected readonly showConfirmacion  = signal(false);
  protected readonly slots             = signal<SlotReprogramar[]>([]);
  protected readonly conflictoBloque   = signal<string | null>(null);

  protected readonly slotSeleccionado = computed(
    () => this.slots().find(s => s.estado === 'seleccionado') ?? null
  );

  protected readonly slotEsExcepcion = computed(
    () => this.slots().some(
      s => (s.estado === 'seleccionado' || s.estado === 'rango') && s.estadoOriginal === 'excepcion'
    )
  );

  protected readonly horasExcepcionComprometidas = computed(() =>
    this.slots()
      .filter(s => (s.estado === 'seleccionado' || s.estado === 'rango') && s.estadoOriginal === 'excepcion')
      .map(s => s.hora)
      .join(', ')
  );

  protected readonly puedeConfirmar = computed(
    () => !!this.nuevaFecha() && this.slotSeleccionado() !== null
  );

  protected readonly mensajeConfirmacion =
    'Este cambio liberará los bloques de la fecha original y reservará los nuevos bloques seleccionados. ' +
    'En caso de que ya se haya asignado una grúa y un operador, estos serán liberados. ' +
    'La operación se encontrará ahora en un estado "Reservado" y pendiente de asignación.';

  ngOnInit(): void {
    const raw      = this.reserva().fechaServicio;
    const fechaStr = raw.includes('T') ? raw.split('T')[0] : raw;
    this.nuevaFecha.set(fechaStr);
    this.cargarSlots(fechaStr);
  }

  protected onFechaChange(fecha: string): void {
    this.nuevaFecha.set(fecha);
    this.conflictoBloque.set(null);
    this.error.set(null);
    this.advertencia.set(null);
    if (fecha) this.cargarSlots(fecha);
  }

  protected cargarSlots(fechaStr: string): void {
    const [y, m, d] = fechaStr.split('-').map(Number);
    const fecha      = new Date(y, m - 1, d);
    const r          = this.reserva();
    const rol        = this.authSvc.session()?.rol ?? 'ADMINISTRADOR';

    this.cargandoSlots.set(true);
    this.slots.set([]);

    this.reservasSvc.getHorariosReprogramacion(fecha, rol, r.cantidadCarga, r.id).subscribe({
      next: data => {
        this.slots.set(
          (data ?? []).map(h => {
            const hora   = h.hora?.slice(0, 5) ?? h.hora;
            const est    = (h.estado ?? '').toLowerCase();
            const origin: SlotReprogramar['estadoOriginal'] =
              est === 'excepcion' ? 'excepcion' : 'libre';
            return { hora, estado: origin, estadoOriginal: origin };
          })
        );
        this.cargandoSlots.set(false);
      },
      error: () => this.cargandoSlots.set(false),
    });
  }

  protected onClickSlot(idx: number): void {
    const s       = this.slots()[idx];
    const bloques = this.reserva().nroBloques;

    if (s.estado === 'seleccionado' || s.estado === 'rango') {
      this.conflictoBloque.set(null);
      this.slots.update(prev =>
        prev.map(slot =>
          slot.estado === 'seleccionado' || slot.estado === 'rango'
            ? { ...slot, estado: slot.estadoOriginal }
            : slot
        )
      );
      return;
    }

    if (this.slots().some(sl => sl.estado === 'seleccionado')) return;

    this.conflictoBloque.set(null);

    const horaInicio     = parseInt(s.hora.split(':')[0]);
    const horasRestantes = Array.from({ length: bloques - 1 }, (_, i) => {
      const h = (horaInicio + i + 1) % 24;
      return `${String(h).padStart(2, '0')}:00`;
    });

    const currentSlots     = this.slots();
    const indicesRestantes = horasRestantes.map(hora =>
      currentSlots.findIndex(
        sl => sl.hora === hora && (sl.estado === 'libre' || sl.estado === 'excepcion')
      )
    );

    if (indicesRestantes.some(i => i === -1)) {
      this.conflictoBloque.set(
        `No hay ${bloques} bloques consecutivos disponibles desde ${s.hora}`
      );
      return;
    }

    this.slots.update(prev =>
      prev.map((slot, i) => {
        if (i === idx)                    return { ...slot, estado: 'seleccionado' as const };
        if (indicesRestantes.includes(i)) return { ...slot, estado: 'rango'        as const };
        return slot;
      })
    );
  }

  protected limpiarSeleccion(): void {
    this.conflictoBloque.set(null);
    this.error.set(null);
    this.advertencia.set(null);
    this.slots.update(prev =>
      prev.map(s => ({ ...s, estado: s.estadoOriginal }))
    );
  }

  protected slotClass(s: SlotReprogramar): string {
    switch (s.estado) {
      case 'seleccionado': return 'bg-[#2b7fff] border-[#155dfc] text-white cursor-pointer shadow-md';
      case 'rango':        return 'bg-[#93c5fd] border-[#3b82f6] text-[#1e3a8a] cursor-pointer';
      case 'excepcion':    return 'bg-[#f3f4f6] border-dashed border-[#9ca3af] text-[#4b5563] cursor-pointer hover:bg-[#e5e7eb]';
      default:             return 'bg-white border-[#00c950] text-[#364153] hover:border-[#155dfc] hover:bg-[#eff6ff] cursor-pointer';
    }
  }

  /** "2026-05-01T00:00:00" → "01/05/2026" */
  protected get fechaServicioFormateada(): string {
    const raw  = this.reserva().fechaServicio;
    const date = new Date(raw.includes('T') ? raw : raw + 'T00:00:00');
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /** "12:00:00" → "12:00" */
  protected get horaInicioFormateada(): string {
    return this.reserva().horaInicio?.slice(0, 5) ?? this.reserva().horaInicio;
  }

  protected onGuardar(): void {
    if (!this.puedeConfirmar()) return;
    this.error.set(null);
    this.showConfirmacion.set(true);
  }

  protected onConfirmarModal(): void {
    const slot = this.slotSeleccionado();
    if (!slot) return;

    this.guardando.set(true);
    this.operacionesSvc.reprogramarReserva(
      this.reserva().id,
      this.nuevaFecha(),
      slot.hora,
      this.reserva().nroBloques,
    ).subscribe({
      next: () => { this.guardando.set(false); this.confirmar.emit(this.reserva().id); },
      error: (err) => {
        this.guardando.set(false);
        const body    = err?.error;
        const mensaje = body?.mensaje ?? 'Ocurrió un error inesperado al reprogramar la reserva.';
        const horas   = body?.horasConflicto ? ` Horas afectadas: ${body.horasConflicto}.` : '';

        if (mensaje.toLowerCase().includes('excepción') || mensaje.toLowerCase().includes('excepcion')) {
          this.advertencia.set(mensaje + horas);
          this.error.set(null);
        } else {
          this.error.set(mensaje + horas);
          this.advertencia.set(null);
        }
      },
    });
  }
}
