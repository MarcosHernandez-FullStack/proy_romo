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
  id: string;
  empresa: string;
  contacto: string;
  correo: string;
  telefono: string;
  loginId: string;
  password: string;
  tarifaBase: number;
  tarifaKm: number;
  activo: boolean;
}

export interface Operador {
  id: string;
  nombre: string;
  telefono: string;
  loginId: string;
  password: string;
  licencia: string;
  vencimientoLicencia: string;
  proximoServicio: string | null;
  activo: boolean;
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
  estado: 'libre' | 'ocupado' | 'cerrado' | 'seleccionado' | 'bloqueado' | 'conflicto';
}

export type RolUsuario = 'Administrador' | 'Staff';
export type EstadoAdminServicio = 'Pendiente' | 'Facturado' | 'Pagado';

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  fechaCreacion: string;
  activo: boolean;
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
}

export interface ServicioReporte extends ServicioAdmin {
  estadoAdministrativo: EstadoAdminServicio;
  fechaCompleta: string;
  grua: string;
}
