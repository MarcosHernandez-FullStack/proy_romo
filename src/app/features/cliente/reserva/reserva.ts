import { Component, OnDestroy, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Truck,
  MapPin,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  Info,
  Lock,
  Calendar,
} from 'lucide-angular';
import { TipoCarga } from '../../../models/reserva.model';

interface SlotHorario {
  hora: string;
  estado: 'disponible' | 'ocupado' | 'seleccionado' | 'bloqueado' | 'conflicto';
}

interface VehiculoForm {
  tipoVehiculo: string;
  placa: string;
  descripcion: string;
  expandido: boolean;
}

interface DiaSemana {
  abbr: string;
  num: number;
  mes: string;
}

@Component({
  selector: 'app-reserva',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './reserva.html',
})
export class ReservaComponent implements OnDestroy {
  protected readonly TruckIcon = Truck;
  protected readonly MapPinIcon = MapPin;
  protected readonly CarIcon = Car;
  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly ClockIcon = Clock;
  protected readonly DollarSignIcon = DollarSign;
  protected readonly ChevronDownIcon = ChevronDown;
  protected readonly ChevronUpIcon = ChevronUp;
  protected readonly XIcon = X;
  protected readonly AlertIcon = AlertTriangle;
  protected readonly InfoIcon = Info;
  protected readonly LockIcon = Lock;
  protected readonly CalendarIcon = Calendar;

  // ── Sección 0 ─────────────────────────────
  protected readonly tipoCarga = signal<TipoCarga>('estandar');
  protected readonly cantidadVehiculos = signal(2);

  protected readonly vehiculoCount = computed(() =>
    this.tipoCarga() === 'estandar' ? 1 : Math.max(2, this.cantidadVehiculos())
  );

  // ── Sección 1 ─────────────────────────────
  protected readonly origen = signal('');
  protected readonly destino = signal('');
  protected readonly rutaLista = computed(
    () => this.origen().trim().length > 0 && this.destino().trim().length > 0
  );
  protected readonly mostrarSeccion2 = this.rutaLista;

  // ── Sección 2 – Calendario ─────────────────
  protected readonly dias: DiaSemana[] = [
    { abbr: 'MIÉ', num: 25, mes: 'feb' },
    { abbr: 'JUE', num: 26, mes: 'feb' },
    { abbr: 'VIE', num: 27, mes: 'feb' },
    { abbr: 'SÁB', num: 28, mes: 'feb' },
    { abbr: 'DOM', num: 1,  mes: 'mar' },
    { abbr: 'LUN', num: 2,  mes: 'mar' },
    { abbr: 'MAR', num: 3,  mes: 'mar' },
  ];
  protected readonly diaSeleccionado = signal(0);

  // ── Sección 2 – Slots ──────────────────────
  protected readonly slots = signal<SlotHorario[]>([
    { hora: '08:00', estado: 'seleccionado' },
    { hora: '09:00', estado: 'ocupado' },
    { hora: '10:00', estado: 'ocupado' },
    { hora: '11:00', estado: 'disponible' },
    { hora: '12:00', estado: 'disponible' },
    { hora: '13:00', estado: 'conflicto' },
    { hora: '14:00', estado: 'ocupado' },
    { hora: '15:00', estado: 'ocupado' },
    { hora: '16:00', estado: 'disponible' },
    { hora: '17:00', estado: 'bloqueado' },
    { hora: '18:00', estado: 'bloqueado' },
  ]);

  protected readonly slotSeleccionado = computed(
    () => this.slots().find((s) => s.estado === 'seleccionado') ?? null
  );

  // ── Timer ──────────────────────────────────
  protected readonly timerDisplay = signal('5:00');
  private timerSecondsLeft = 300;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private timerStarted = false;

  // ── Sección 3 ──────────────────────────────
  protected readonly horarioValidado = signal(false);
  protected readonly mostrarSeccion3 = this.horarioValidado;

  protected readonly observaciones = signal('');

  protected readonly vehiculoForms = signal<VehiculoForm[]>([
    { tipoVehiculo: '', placa: '', descripcion: '', expandido: true },
  ]);

  // ── Modal ──────────────────────────────────
  protected readonly showModal = signal(false);

  constructor() {
    // Iniciar timer cuando aparece sección 2
    effect(() => {
      if (this.mostrarSeccion2() && !this.timerStarted) {
        this.timerStarted = true;
        this.iniciarTimer();
      }
    });

    // Sincronizar formularios de vehículos con la cantidad
    effect(
      () => {
        const count = this.vehiculoCount();
        const current = this.vehiculoForms();
        if (current.length !== count) {
          this.vehiculoForms.set(
            Array.from(
              { length: count },
              (_, i) => current[i] ?? { tipoVehiculo: '', placa: '', descripcion: '', expandido: i === 0 }
            )
          );
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private iniciarTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timerSecondsLeft = Math.max(0, this.timerSecondsLeft - 1);
      const m = Math.floor(this.timerSecondsLeft / 60);
      const s = this.timerSecondsLeft % 60;
      this.timerDisplay.set(`${m}:${s.toString().padStart(2, '0')}`);
      if (this.timerSecondsLeft === 0) {
        clearInterval(this.timerInterval!);
        this.timerInterval = null;
      }
    }, 1000);
  }

  protected selectSlot(slot: SlotHorario): void {
    if (slot.estado !== 'disponible' && slot.estado !== 'seleccionado') return;
    this.horarioValidado.set(false);
    this.slots.update((slots) =>
      slots.map((s) => ({
        ...s,
        estado:
          s.hora === slot.hora
            ? 'seleccionado'
            : s.estado === 'seleccionado'
            ? 'disponible'
            : s.estado,
      }))
    );
  }

  protected validarHorario(): void {
    this.horarioValidado.set(true);
  }

  protected editarHorario(): void {
    this.horarioValidado.set(false);
    this.slots.update((slots) =>
      slots.map((s) => (s.estado === 'seleccionado' ? { ...s, estado: 'disponible' } : s))
    );
  }

  protected toggleVehiculo(i: number): void {
    this.vehiculoForms.update((forms) =>
      forms.map((f, idx) => ({ ...f, expandido: idx === i ? !f.expandido : f.expandido }))
    );
  }

  protected updateVehiculo(i: number, field: keyof Omit<VehiculoForm, 'expandido'>, value: string): void {
    this.vehiculoForms.update((forms) =>
      forms.map((f, idx) => (idx === i ? { ...f, [field]: value } : f))
    );
  }

  protected confirmarReserva(): void {
    this.showModal.set(true);
  }

  protected cancelarModal(): void {
    this.showModal.set(false);
  }

  protected submitReserva(): void {
    // TODO: reemplazar con this.reservaService.crear({...}).subscribe(...)
    this.showModal.set(false);
    alert('¡Reserva confirmada exitosamente!');
  }

  protected getSlotClass(slot: SlotHorario): string {
    const base =
      'h-14 rounded-xl border-2 text-[15px] font-semibold transition-colors flex flex-col items-center justify-center gap-0.5 select-none';
    switch (slot.estado) {
      case 'seleccionado':
        return `${base} bg-[#155dfc] border-[#155dfc] text-white cursor-pointer`;
      case 'ocupado':
        return `${base} bg-[#1e2939] border-[#1e2939] text-white cursor-not-allowed`;
      case 'bloqueado':
        return `${base} bg-white border-[#e5e7eb] text-[#d1d5dc] cursor-not-allowed`;
      case 'conflicto':
        return `${base} bg-white border-red-400 text-red-500 cursor-not-allowed`;
      default:
        return `${base} bg-white border-[#86efac] text-[#364153] hover:border-[#155dfc] hover:text-[#155dfc] cursor-pointer`;
    }
  }

  protected getHorarioConfirmado(): string {
    const slot = this.slotSeleccionado();
    if (!slot) return '';
    const dia = this.dias[this.diaSeleccionado()];
    const [h, m] = slot.hora.split(':').map(Number);
    const fin = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return `Inicio: ${slot.hora} (${dia.num}/${dia.mes}) | Fin: ${fin} (${dia.num}/${dia.mes}) | Duración: 1 bloque`;
  }

  protected tipoCargaLabel(): string {
    return this.tipoCarga() === 'estandar'
      ? `Carga Estándar (${this.vehiculoCount()} vehículo)`
      : `Carga Múltiple (${this.vehiculoCount()} vehículos)`;
  }
}
