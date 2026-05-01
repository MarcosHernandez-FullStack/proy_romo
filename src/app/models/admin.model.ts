export type EstadoServicioAdmin = 'Reservado' | 'Asignado' | 'En Curso' | 'Finalizado' | 'Cancelado';
export type TipoExcepcion = 'Festivo' | 'Mantenimiento' | 'Bloqueo';
export type AlcanceExcepcion = 'Día Completo' | 'Rango de Horas';
export type EstadoUnidad = 'Operativa' | 'En Taller' | 'Baja';

export interface ServicioAdmin {
  id: string;
  cliente: string;
  costo: number;
  origen: string;
  destino: string;
  distanciaKm: number;
  fecha: string;
  hora: string;
  tiempoMin: number;
  bloques: number;
  carga: string;
  vehiculos: number;
  operador: string | null;
  unidad: string | null;
  estado: EstadoServicioAdmin;
}

export interface ClienteB2B {
  id:              string;
  empresa:         string;
  contacto:        string;
  correo:          string;
  telefono:        string;
  loginId:         string;
  password:        string;
  tarifaBase:      number;
  tarifaKm:        number;
  tipoTarifaBase:  'GLOBAL' | 'CUSTOM';
  tipoTarifaKm:    'GLOBAL' | 'CUSTOM';
  activo:          boolean;
}

export type TipoDisponibilidad = 'Tiempo Completo' | 'Horario Parcial' | 'Personalizado';

export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
export const HORAS_GRID = [
  '00:00','01:00','02:00','03:00','04:00','05:00',
  '06:00','07:00','08:00','09:00','10:00','11:00',
  '12:00','13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00','21:00','22:00','23:00',
] as const;
export type DiaSemana = typeof DIAS_SEMANA[number];
export type HoraGrid  = typeof HORAS_GRID[number];
export type GridDisponibilidad = Record<DiaSemana, Record<HoraGrid, boolean>>;

export interface ServicioProximo {
  id: string;
  fecha: string;
  hora: string;
  cliente: string;
}

export interface Operador {
  id: string;
  nombre: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  loginId: string;
  password: string;
  licencia: string;
  vencimientoLicencia: string;
  proximoServicio: { fecha: string; hora: string } | null;
  serviciosAsignados: ServicioProximo[];
  tipoDisponibilidad: TipoDisponibilidad;
  disponibilidad: GridDisponibilidad;
  activo: boolean;
}

export interface EditarOperadorRequest {
  contrasena: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  rol: 'OPERADOR';
  nroLicencia: string;
  fecVenLic: string;  // YYYY-MM-DD
}

export interface CrearOperadorRequest {
  alias: string;
  contrasena: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  rol: 'OPERADOR';
  nroLicencia: string;
  fecVenLic: string;  // YYYY-MM-DD
}

export interface CrearUsuarioResult {
  exitoso: number;
  mensaje: string;
  idNuevo: number;
}

export interface UnidadFlota {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  capacidad: number;
  vencimientoSeguro: string;
  estado: EstadoUnidad;
}

export interface GruaRequest {
  placa:          string;
  marca:          string;
  modelo:         string;
  añoFabricacion: number;
  capacidad:      number;
  fecVenSeg:      string;  // YYYY-MM-DD
}


export interface BitacoraEntry {
  tipo: string;
  fecha: string;
  responsable: string;
  kilometraje: number;
  nota: string;
}

export interface ExcepcionAgenda {
  id: string;
  fecha: string;
  tipo: TipoExcepcion;
  alcance: AlcanceExcepcion;
  horaInicio?: string;
  horaFin?: string;
  motivo: string;
}

export interface HorarioRegular {
  dia: string;
  abre: string;
  cierra: string;
  activo: boolean;
}

export interface SlotAdmin {
  hora: string;
  estado: 'libre' | 'ocupado' | 'cerrado' | 'seleccionado' | 'rango' | 'bloqueado' | 'conflicto' | 'excepcion';
  estadoOriginal?: 'libre' | 'excepcion';
}

export type RolUsuario = 'Administrador' | 'Staff';
export type EstadoAdminServicio = 'Pendiente' | 'Facturado' | 'Pagado';

export interface UsuarioAdmin {
  id:            string;
  nombres:       string;
  apellidos:     string;
  correo:        string;
  telefono:      string;
  rol:           RolUsuario;
  fechaCreacion: string;
  activo:        boolean;
}

export interface TarifaCliente {
  clienteId: string;
  tarifaBase: number;
  tarifaKm: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
}

export interface ParametrosOperativos {
  umbralLargaDistanciaKm: number;
  margenManiobraMin: number;
  umbralToleranciaMin: number;
  tiempoRetornoBaseMin: number;
  tiempoCorte: number;
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

export interface VehiculoReserva {
  placa:       string | null;
  modelo:      string | null;
  tipo:        string | null;
  observacion: string | null;
}

export interface ReservaOperacion {
  id:               number;
  direccionOrigen:  string;
  direccionDestino: string;
  cantidadCarga:    number;
  fechaServicio:    string;
  horaInicio:       string;
  horaFin:          string;
  nroBloques:       number;
  distanciaKm:      number;
  tiempoEstimado:   number;
  tiempoManiobra:   number;
  estadoOperacion:  string;
  estado:           string;
  gruaAsignada?:    string | null;
  operadorAsignado?: string | null;
  nombreCliente?:   string | null;
  vehiculos?:       VehiculoReserva[];
}

export interface ReservaALiberar {
  id:              number;
  fechaServicio:   string;
  horaInicio:      string;
  nombreCliente:   string;
  estadoOperacion: string;
}

export interface ServicioReporte extends ServicioAdmin {
  estadoAdministrativo: EstadoAdminServicio;
  fechaCompleta: string;
  grua: string;
}


export interface DisponibilidadGrua {
  horaStr:                 string;
  capacidad:               number;
  cantidadReservas:        number;
  cantidadGruas:           number;
  cantidadGruasDisponible: number;
}

// ── Disponibilidad de Operadores ──────────────────────────────

export interface DispSlot {
  id:         number;
  nroDia:     number;
  nombreDia:  string;
  horaInicio: string; // "HH:mm"
  horaFin:    string; // "HH:mm"
}

export interface DispOperador {
  slots:               DispSlot[];
  totalHorasSemanales: number;
  diasActivos:         number;
}

export interface DispRango {
  NroDia:     number;
  NombreDia:  string;
  HoraInicio: string; // "HH:mm"
  HoraFin:    string; // "HH:mm"
}

export interface DispResult {
  exitoso: number;
  mensaje: string;
}
