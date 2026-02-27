export type TipoCarga = 'estandar' | 'multiple';

export interface SlotHorario {
  hora: string;
  estado: 'disponible' | 'ocupado' | 'seleccionado' | 'bloqueado' | 'conflicto';
}

export interface ReservaForm {
  tipoCarga: TipoCarga;
  cantidadVehiculos: number;
  origen: string;
  destino: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipoVehiculo: string;
  placa: string;
  descripcion: string;
  observaciones: string;
}
