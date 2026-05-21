export type TipoCarga = 'estandar' | 'multiple';

export interface SlotHorario {
  hora:   string;
  estado: 'disponible' | 'ocupado' | 'seleccionado' | 'bloqueado' | 'conflicto';
}

export interface ReservaForm {
  tipoCarga:        TipoCarga;
  cantidadVehiculos: number;
  origen:           string;
  destino:          string;
  fecha:            string;
  horaInicio:       string;
  horaFin:          string;
  tipoVehiculo:     string;
  placa:            string;
  descripcion:      string;
  observaciones:    string;
}

export interface VehiculoApiItem {
  placa?:       string | null;
  modelo?:      string | null;
  tipo?:        string | null;
  observacion?: string | null;
}

export interface ReservaApiItem {
  id:                   number;
  direccionOrigen:      string;
  direccionDestino:     string;
  cantidadCarga:        number;
  horaInicio:           string;
  horaFin:              string;
  nroBloques:           number;
  estadoOperacion:      string;
  estadoAdministrativo: string;
  nombreCliente?:       string | null;
  gruaAsignada?:        string | null;
  operadorAsignado?:    string | null;
  vehiculos?:           VehiculoApiItem[];
  fechaHoraFormateada:  string;
  cantidadVehiculos:    number;
  costo:                number;
}

export interface ValidarHorarioDto {
  fechaServicio:        string;
  horaInicio:           string;
  horaFin:              string;
  cantidadCarga:        number;
  rol:                  string;
  idCliente:            number;
  idOperador:           number | null;
  direccionOrigen:      string;
  coordLatOrigen:       string;
  coordLonOrigen:       string;
  direccionDestino:     string;
  coordLatDestino:      string;
  coordLonDestino:      string;
  distanciaKm:          number;
  tiempoEstimado:       number;
  tiempoManiobra:       number;
  tiempoRetorno:        number;
  nroBloques:           number;
  costoKm:              number;
  costoBase:            number;
  timerExpiracion:      number;
  creadoPor:            number;
  tipoHorario:          string;
  estadoOperacion:      string;
  estadoAdministrativo: string;
  estado:               string;
  fechaCreacion:        string;
}

export interface CrearReservaDto {
  idTimerReserva: number;
  rol:            string;
  vehiculos:      { tipo: string; placa: string; descripcion: string; observacion: string }[];
}

export interface ReservaResultado {
  exitoso:        number;
  mensaje:        string;
  horasConflicto: string | null;
  id:             number | null;
}
