export type EstadoOperativo = 'Finalizado' | 'En Curso' | 'Asignado' | 'Reservado';
export type EstadoAdmin = 'Pagado' | 'Facturado' | 'Pendiente';

export interface Servicio {
  id: string;
  fecha: string;
  hora: string;
  origen: string;
  destino: string;
  vehiculos: number;
  costo: number;
  estadoOperativo: EstadoOperativo;
  estadoAdmin: EstadoAdmin;
}

export interface TrazabilidadItem {
  estado: string;
  descripcion: string;
  fecha: string;
  hora: string;
  color: 'green' | 'blue' | 'orange';
}

export interface DetalleServicio extends Servicio {
  operadorNombre: string;
  operadorTelefono: string;
  unidadPlaca: string;
  horaInicio: string;
  horaFin: string;
  duracionHoras: number;
  tipoVehiculo: string;
  placa: string;
  descripcionVehiculo: string;
  observaciones: string;
  trazabilidad: TrazabilidadItem[];
}
