export type EstadoServicioAdmin = 'Reservado' | 'Asignado' | 'En Curso' | 'Finalizado' | 'Cancelado';
export type EstadoAdminServicio = 'Pendiente' | 'Facturado' | 'Pagado';
export type EstadoOperativo     = 'Finalizado' | 'En Curso' | 'Asignado' | 'Reservado';

export interface ServicioAdmin {
  id:          string;
  cliente:     string;
  costo:       number;
  origen:      string;
  destino:     string;
  distanciaKm: number;
  fecha:       string;
  hora:        string;
  tiempoMin:   number;
  bloques:     number;
  carga:       string;
  vehiculos:   number;
  operador:    string | null;
  unidad:      string | null;
  estado:      EstadoServicioAdmin;
}

export interface Servicio {
  id:             string;
  fecha:          string;
  hora:           string;
  origen:         string;
  destino:        string;
  vehiculos:      number;
  costo:          number;
  estadoOperativo: EstadoOperativo;
  estadoAdmin:    EstadoAdminServicio;
}

export interface TrazabilidadItem {
  estado:      string;
  descripcion: string;
  fecha:       string;
  hora:        string;
  color:       'green' | 'blue' | 'orange';
}

export interface VehiculoDetalle {
  tipo:        string;
  placa:       string;
  modelo:      string;
  observacion: string;
}

export interface DetalleServicio extends Servicio {
  operadorNombre:   string;
  operadorTelefono: string;
  unidadPlaca:      string;
  horaInicio:       string;
  horaFin:          string;
  duracionHoras:    number;
  vehiculosDetalle: VehiculoDetalle[];
  trazabilidad:     TrazabilidadItem[];
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
  id:                 number;
  direccionOrigen:    string;
  direccionDestino:   string;
  cantidadCarga:      number;
  fechaServicio:      string;
  horaInicio:         string;
  horaFin:            string;
  nroBloques:         number;
  distanciaKm:        number;
  tiempoEstimado:     number;
  tiempoManiobra:     number;
  estadoOperacion:    string;
  estado:             string;
  gruaAsignada?:      string | null;
  operadorAsignado?:  string | null;
  nombreCliente?:     string | null;
  vehiculos?:         VehiculoDetalle[];
  costoTotal?:        number | null;
  motivoCancelacion?: string | null;
  canceladoPor?:      string | null;
}

export interface ReservaALiberar {
  id:              number;
  fechaServicio:   string;
  horaInicio:      string;
  nombreCliente:   string;
  estadoOperacion: string;
}
