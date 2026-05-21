export type TipoExcepcion   = 'Feriado' | 'Mantenimiento' | 'Bloqueo';
export type AlcanceExcepcion = 'Día Completo' | 'Rango de Horas Específico';

export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
export const HORAS_GRID = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
] as const;
export type DiaSemana        = typeof DIAS_SEMANA[number];
export type HoraGrid         = typeof HORAS_GRID[number];
export type GridDisponibilidad = Record<DiaSemana, Record<HoraGrid, boolean>>;

export interface ExcepcionAgenda {
  id:                number;
  fecha:             string;
  motivo:            string;
  alcance:           string;
  tiempoInicio:      string;
  tiempoFinal:       string;
  descripcionMotivo: string;
  estado:            string;
}

export interface HorarioRegular {
  id:     number;
  dia:    string;
  abre:   string;
  cierra: string;
  activo: boolean;
}

export interface SlotAdmin {
  hora:          string;
  estado:        'libre' | 'ocupado' | 'cerrado' | 'seleccionado' | 'rango' | 'bloqueado' | 'conflicto' | 'excepcion';
  estadoOriginal?: 'libre' | 'excepcion';
}

export interface HorarioApiItem {
  id:         number;
  nroDia:     number;
  nombreDia:  string;
  estado:     string;
  horaInicio: string;
  horaFinal:  string;
}

export interface CrearUpdExcepcionDto {
  id:                number;
  fecha:             string;
  motivo:            string;
  horaInicio:        string;
  horaFin:           string;
  descripcionMotivo: string;
}

export interface AgendaExcepcionResult {
  exitoso: number;
  mensaje: string;
  idNuevo: number;
}

