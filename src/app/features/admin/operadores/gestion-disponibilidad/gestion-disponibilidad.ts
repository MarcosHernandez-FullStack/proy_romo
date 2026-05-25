import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DIAS_SEMANA, DiaSemana, GridDisponibilidad, HoraGrid, HORAS_GRID } from '../../../../models/agenda.model';
import { DispRango, Operador, TipoDisponibilidad } from '../../../../models/operadores.model';
import { OperadoresService } from '../../../../core/services/operadores.service';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';
import { MensajeModalComponent } from '../../../../shared/components/mensaje-modal/mensaje-modal';

interface Template {
  label: string;
  color: string;
  dias:  DiaSemana[];
  horas: HoraGrid[];
}

// NroDia: 1=Dom, 2=Lun, 3=Mar, 4=Mié, 5=Jue, 6=Vie, 7=Sáb (EXTRACT(DOW)+1)
const NRO_DIA: Record<DiaSemana, number> = {
  Dom: 1, Lun: 2, Mar: 3, Mié: 4, Jue: 5, Vie: 6, Sáb: 7,
};

const HORAS_NEGOCIO: HoraGrid[] = [
  '08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00',
];

@Component({
  selector: 'app-gestion-disponibilidad',
  standalone: true,
  imports: [FormsModule, ExitoModalComponent, MensajeModalComponent],
  templateUrl: './gestion-disponibilidad.html',
})
export class GestionDisponibilidadComponent implements OnInit {
  private readonly operadoresSvc = inject(OperadoresService);

  readonly operador = input.required<Operador>();
  readonly guardar  = output<void>();
  readonly cerrar   = output<void>();

  readonly dias  = DIAS_SEMANA;
  readonly horas = HORAS_GRID;

  grid       = signal<GridDisponibilidad>({} as GridDisponibilidad);
  diaACopiar = signal<DiaSemana>('Lun');

  cargando  = signal(false);
  guardando = signal(false);

  mensajeConflicto = signal('');
  rangosEnEspera   = signal<DispRango[] | null>(null);

  showExito  = signal(false);
  errorModal = signal<string | null>(null);
  mensajeExito = signal('');

  readonly templates: Template[] = [
    {
      label: 'Tiempo Completo 08:00-18:00',
      color: 'border-green-400 text-green-700 bg-green-50 hover:bg-green-100',
      dias:  ['Lun','Mar','Mié','Jue','Vie'],
      horas: [...HORAS_NEGOCIO],
    },
    {
      label: 'Medio Turno Mañana',
      color: 'border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100',
      dias:  ['Lun','Mar','Mié','Jue','Vie'],
      horas: ['08:00','09:00','10:00','11:00','12:00'],
    },
    {
      label: 'Medio Turno Tarde',
      color: 'border-purple-400 text-purple-700 bg-purple-50 hover:bg-purple-100',
      dias:  ['Lun','Mar','Mié','Jue','Vie'],
      horas: ['13:00','14:00','15:00','16:00','17:00'],
    },
    {
      label: 'Fines de Semana',
      color: 'border-indigo-400 text-indigo-700 bg-indigo-50 hover:bg-indigo-100',
      dias:  ['Sáb','Dom'],
      horas: [...HORAS_NEGOCIO],
    },
  ];

  readonly totalHoras = computed(() => {
    let count = 0;
    for (const dia of this.dias) {
      for (const hora of this.horas) {
        if (this.grid()[dia]?.[hora]) count++;
      }
    }
    return count;
  });

  readonly diasActivos = computed(() =>
    this.dias.filter(dia => this.horas.some(hora => this.grid()[dia]?.[hora])).length
  );

  readonly tipoResumen = computed((): TipoDisponibilidad => {
    const g = this.grid();
    const diasLab: DiaSemana[] = ['Lun','Mar','Mié','Jue','Vie'];
    const esCompleto =
      diasLab.every(d =>
        HORAS_NEGOCIO.every(h => g[d]?.[h]) &&
        this.horas.filter(h => !HORAS_NEGOCIO.includes(h)).every(h => !g[d]?.[h])
      ) &&
      !(['Sáb','Dom'] as DiaSemana[]).some(d => this.horas.some(h => g[d]?.[h]));
    if (esCompleto) return 'Tiempo Completo';
    const total = this.totalHoras();
    if (total === 0) return 'Personalizado';
    return total <= 25 ? 'Horario Parcial' : 'Personalizado';
  });

  ngOnInit(): void {
    this.grid.set(this.emptyGrid());
    this.cargarDesdeApi();
  }

  private cargarDesdeApi(): void {
    const id = this.idNumerico();
    if (!id) return;

    this.cargando.set(true);
    this.operadoresSvc.getDispOperador(id).subscribe({
      next: resp => {
        const grid = this.emptyGrid();
        for (const slot of resp.slots) {
          const dia = this.nroDiaADia(slot.nroDia);
          if (!dia) continue;
          const inicio = this.horaAMinutos(slot.horaInicio);
          const fin    = this.horaAMinutos(slot.horaFin);
          for (let m = inicio; m < fin; m += 60) {
            const h = this.minutosAHoraGrid(m);
            if (h) grid[dia][h] = true;
          }
        }
        this.grid.set(grid);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  toggle(dia: DiaSemana, hora: HoraGrid): void {
    this.grid.update(g => {
      const next = this.clonarGrid(g);
      next[dia][hora] = !next[dia][hora];
      return next;
    });
  }

  toggleDia(dia: DiaSemana, valor: boolean): void {
    this.grid.update(g => {
      const next = this.clonarGrid(g);
      for (const hora of this.horas) next[dia][hora] = valor;
      return next;
    });
  }

  isDiaCompleto(dia: DiaSemana): boolean {
    return this.horas.every(h => this.grid()[dia]?.[h]);
  }

  applyTemplate(t: Template): void {
    this.grid.update(() => {
      const next = this.emptyGrid();
      for (const dia of this.dias) {
        for (const hora of this.horas) {
          next[dia][hora] = t.dias.includes(dia) && t.horas.includes(hora);
        }
      }
      return next;
    });
  }

  copiarDia(): void {
    const origen = this.diaACopiar();
    this.grid.update(g => {
      const next    = this.clonarGrid(g);
      const origen_ = { ...next[origen] };
      for (const dia of this.dias) {
        if (dia !== origen) next[dia] = { ...origen_ };
      }
      return next;
    });
  }

  onGuardar(): void {
    this.limpiarConflicto();
    const id = this.idNumerico();
    if (!id) return;

    const rangos = this.gridARangos();
    this.guardando.set(true);
    this.operadoresSvc.guardarDispOperador(id, rangos, false).subscribe({
      next: result => {
        this.guardando.set(false);
        if (result.exitoso === 1) {
          this.mensajeExito.set(result.mensaje);
          this.showExito.set(true);
        } else if (result.exitoso === 3) {
          this.mensajeConflicto.set(result.mensaje);
          this.rangosEnEspera.set(rangos);
        } else {
          this.errorModal.set(result.mensaje || 'Error al guardar la disponibilidad.');
        }
      },
      error: err => {
        this.guardando.set(false);
        this.errorModal.set(err?.error?.mensaje ?? 'Error al guardar la disponibilidad.');
      },
    });
  }

  onConfirmar(): void {
    const id     = this.idNumerico();
    const rangos = this.rangosEnEspera();
    if (!id || !rangos) return;

    this.limpiarConflicto();
    this.guardando.set(true);
    this.operadoresSvc.guardarDispOperador(id, rangos, true).subscribe({
      next: result => {
        this.guardando.set(false);
        if (result.exitoso === 1) {
          this.mensajeExito.set(result.mensaje);
          this.showExito.set(true);
        } else {
          this.errorModal.set(result.mensaje || 'Error inesperado al confirmar.');
        }
      },
      error: err => {
        this.guardando.set(false);
        this.errorModal.set(err?.error?.mensaje ?? 'Error al confirmar el guardado.');
      },
    });
  }

  onCancelarConfirmacion(): void {
    this.limpiarConflicto();
  }

  private limpiarConflicto(): void {
    this.mensajeConflicto.set('');
    this.rangosEnEspera.set(null);
  }

  // ── Helpers de conversión ──────────────────────────────────

  private idNumerico(): number | null {
    return this.operador().id || null;
  }

  private gridARangos(): DispRango[] {
    const rangos: DispRango[] = [];
    for (const dia of this.dias) {
      let inicio: HoraGrid | null     = null;
      let ultimaHora: HoraGrid | null = null;

      for (const hora of this.horas) {
        if (this.grid()[dia]?.[hora]) {
          if (!inicio) inicio = hora;
          ultimaHora = hora;
        } else {
          if (inicio && ultimaHora) {
            rangos.push({
              NroDia:     NRO_DIA[dia],
              NombreDia:  dia,
              HoraInicio: inicio,
              HoraFin:    this.sumarUnaHora(ultimaHora),
            });
          }
          inicio     = null;
          ultimaHora = null;
        }
      }
      if (inicio && ultimaHora) {
        rangos.push({
          NroDia:     NRO_DIA[dia],
          NombreDia:  dia,
          HoraInicio: inicio,
          HoraFin:    this.sumarUnaHora(ultimaHora),
        });
      }
    }
    return rangos;
  }

  private sumarUnaHora(hora: HoraGrid): string {
    const [h] = hora.split(':').map(Number);
    if (h === 23) return '00:00';
    return `${String(h + 1).padStart(2, '0')}:00`;
  }

  private horaAMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  private minutosAHoraGrid(minutos: number): HoraGrid | null {
    const h   = Math.floor(minutos / 60);
    const str = `${String(h).padStart(2, '0')}:00` as HoraGrid;
    return (HORAS_GRID as readonly string[]).includes(str) ? str : null;
  }

  private nroDiaADia(nroDia: number): DiaSemana | null {
    const mapa: Record<number, DiaSemana> = {
      1: 'Dom', 2: 'Lun', 3: 'Mar', 4: 'Mié', 5: 'Jue', 6: 'Vie', 7: 'Sáb',
    };
    return mapa[nroDia] ?? null;
  }

  private emptyGrid(): GridDisponibilidad {
    const g = {} as GridDisponibilidad;
    for (const dia of this.dias) {
      g[dia] = {} as Record<HoraGrid, boolean>;
      for (const hora of this.horas) g[dia][hora] = false;
    }
    return g;
  }

  private clonarGrid(g: GridDisponibilidad): GridDisponibilidad {
    const next = {} as GridDisponibilidad;
    for (const dia of this.dias) {
      next[dia] = { ...g[dia] } as Record<HoraGrid, boolean>;
    }
    return next;
  }
}
