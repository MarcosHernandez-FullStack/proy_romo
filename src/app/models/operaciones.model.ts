export interface ServicioAdmin {
  id:             number;
  cliente:        string;
  costo:          number;
  origen:         string;
  destino:        string;
  distanciaKm:    number;
  fecha:          string;
  hora:           string;
  tiempoMin:      number;
  bloques:        number;
  cantidadCarga:  number;
  operador:       string | null;
  unidad:         string | null;
  estado:         string;
}

export interface Servicio {
  id:                  number;
  fechaHoraFormateada: string;
  direccionOrigen:     string;
  direccionDestino:    string;
  cantidadVehiculos:   number;
  costo:               number;
  estadoOperacion:     string;
  estadoAdministrativo: string;
}

export interface TrazabilidadItem {
  estado:      string;
  descripcion: string;
  fecha:       string;
  hora:        string;
  color:       'green' | 'blue' | 'orange';
}

export interface VehiculoDetalle {
  tipo?:        string | null;
  placa?:       string | null;
  modelo?:      string | null;
  observacion?: string | null;
}

export interface DetalleServicio extends Servicio {
  operadorAsignado: string | null;
  gruaAsignada:     string | null;
  horaInicio:       string;
  horaFin:          string;
  nroBloques:       number;
  vehiculos:        VehiculoDetalle[];
}

export interface GruaSugerida {
  id:            number;
  placa:         string;
  marca:         string;
  modelo:        string;
  capacidad:     number;
  distanciaKm:   number | null;
  tiempoMin:     number | null;
  clasificacion: string;
}

export interface OperadorSugerido {
  id:            number;
  nombres:       string;
  apellidos:     string;
  distanciaKm:   number | null;
  tiempoMin:     number | null;
  clasificacion: string;
}

export interface Sugerencias {
  gruas:      GruaSugerida[];
  operadores: OperadorSugerido[];
}

export interface ReservaOperacion {
  id:                   number;
  direccionOrigen:      string;
  coordLatOrigen:       string;
  coordLonOrigen:       string;
  direccionDestino:     string;
  coordLatDestino:      string;
  coordLonDestino:      string;
  cantidadCarga:        number;
  fechaServicio:        string;
  horaInicio:           string;
  horaFin:              string;
  nroBloques:           number;
  distanciaKm:          number;
  tiempoEstimado:       number;
  tiempoManiobra:       number;
  tiempoRetorno:        number;
  estadoOperacion:      string;
  estado:               string;
  nombreCliente?:       string | null;
  gruaAsignada?:        string | null;
  operadorAsignado?:    string | null;
  vehiculos?:           VehiculoDetalle[];
  fechaHoraFormateada:  string;
  cantidadVehiculos:    number;
  estadoAdministrativo: string;
  costo:                number;
}

export interface ReservaPagedDto {
  total:          number;
  datos:          ReservaOperacion[];
  totalReservado: number;
  totalAsignado:  number;
  totalEnCurso:   number;
}

export interface GetReservasParams {
  estadoOperacion?:      string;
  id?:                   number;
  fechaInicio?:          string;
  fechaFin?:             string;
  idOperador?:           number;
  idGrua?:               number;
  estadoAdministrativo?: string;
  pagina?:               number;
  tamano?:               number;
}

export interface ReservaALiberar {
  id:              number;
  fechaServicio:   string;
  horaInicio:      string;
  nombreCliente:   string;
  estadoOperacion: string;
}
