import { Component, computed, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DIAS_SEMANA,
  DiaSemana,
  GridDisponibilidad,
  HoraGrid,
  HORAS_GRID,
  Operador,
  TipoDisponibilidad,
} from '../../../../models/admin.model';

interface Template {
  label: string;
  color: string;
  dias: DiaSemana[];
  horas: HoraGrid[];
}

@Component({
  selector: 'app-gestion-disponibilidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-disponibilidad.html',
})
export class GestionDisponibilidadComponent implements OnInit {
  @Input({ required: true }) operador!: Operador;
  @Output() guardar = new EventEmitter<GridDisponibilidad>();
  @Output() cerrar  = new EventEmitter<void>();

  readonly dias  = DIAS_SEMANA;
  readonly horas = HORAS_GRID;

  grid = signal<GridDisponibilidad>({} as GridDisponibilidad);
  diaACopiar = signal<DiaSemana>('Lun');

  readonly templates: Template[] = [
    {
      label: 'Tiempo Completo 08:00-18:00',
      color: 'border-green-400 text-green-700 bg-green-50 hover:bg-green-100',
      dias:  ['Lun','Mar','Mié','Jue','Vie'],
      horas: [...HORAS_GRID],
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
      horas: [...HORAS_GRID],
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

  readonly diasActivos = computed(() => {
    return this.dias.filter(dia =>
      this.horas.some(hora => this.grid()[dia]?.[hora])
    ).length;
  });

  readonly tipoResumen = computed((): TipoDisponibilidad => {
    const g = this.grid();
    const diasLab: DiaSemana[] = ['Lun','Mar','Mié','Jue','Vie'];
    const esCompleto = diasLab.every(d => this.horas.every(h => g[d]?.[h])) &&
                       !(['Sáb','Dom'] as DiaSemana[]).some(d => this.horas.some(h => g[d]?.[h]));
    if (esCompleto) return 'Tiempo Completo';
    const total = this.totalHoras();
    if (total === 0) return 'Personalizado';
    return total <= 25 ? 'Horario Parcial' : 'Personalizado';
  });

  ngOnInit(): void {
    this.grid.set(this.clonarGrid(this.operador.disponibilidad));
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
      const next = {} as GridDisponibilidad;
      for (const dia of this.dias) {
        next[dia] = {} as Record<HoraGrid, boolean>;
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
      const next = this.clonarGrid(g);
      const horasOrigen = { ...next[origen] };
      for (const dia of this.dias) {
        if (dia !== origen) next[dia] = { ...horasOrigen };
      }
      return next;
    });
  }

  onGuardar(): void {
    this.guardar.emit(this.grid());
  }

  private clonarGrid(g: GridDisponibilidad): GridDisponibilidad {
    const next = {} as GridDisponibilidad;
    for (const dia of this.dias) {
      next[dia] = { ...g[dia] } as Record<HoraGrid, boolean>;
    }
    return next;
  }
}
