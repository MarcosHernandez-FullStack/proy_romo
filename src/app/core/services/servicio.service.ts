import { Injectable } from '@angular/core';
import { delay, of } from 'rxjs';
import { DetalleServicio, Servicio } from '../../models/servicio.model';

const SERVICIOS_FAKE: Servicio[] = [
  { id: 'SRV-001', fecha: '12/02/2026', hora: '09:00', origen: 'Av. Corrientes 1234, CABA', destino: 'Av. Santa Fe 5678, CABA', vehiculos: 1, costo: 8500, estadoOperativo: 'Finalizado', estadoAdmin: 'Pagado' },
  { id: 'SRV-002', fecha: '17/02/2026', hora: '14:00', origen: 'Av. 9 de Julio 567, CABA', destino: 'Calle Florida 890, CABA', vehiculos: 2, costo: 17200, estadoOperativo: 'Finalizado', estadoAdmin: 'Facturado' },
  { id: 'SRV-003', fecha: '22/02/2026', hora: '11:00', origen: 'Av. Callao 1234, CABA', destino: 'Av. Las Heras 2890, CABA', vehiculos: 1, costo: 15000, estadoOperativo: 'En Curso', estadoAdmin: 'Pendiente' },
  { id: 'SRV-004', fecha: '24/02/2026', hora: '16:00', origen: 'Av. Rivadavia 4567, CABA', destino: 'Av. Córdoba 3456, CABA', vehiculos: 1, costo: 9500, estadoOperativo: 'Asignado', estadoAdmin: 'Pendiente' },
  { id: 'SRV-005', fecha: '25/02/2026', hora: '10:00', origen: 'Av. Libertador 8900, CABA', destino: 'Puerto Madero, CABA', vehiculos: 3, costo: 28500, estadoOperativo: 'Reservado', estadoAdmin: 'Pendiente' },
  { id: 'SRV-006', fecha: '04/02/2026', hora: '08:00', origen: 'Microcentro, CABA', destino: 'Palermo Hollywood, CABA', vehiculos: 2, costo: 11800, estadoOperativo: 'Finalizado', estadoAdmin: 'Pendiente' },
  { id: 'SRV-007', fecha: '25/01/2026', hora: '13:00', origen: 'Av. Belgrano 2100, CABA', destino: 'Constitución, CABA', vehiculos: 1, costo: 7200, estadoOperativo: 'Finalizado', estadoAdmin: 'Pagado' },
];

const DETALLE_FAKE: DetalleServicio = {
  ...SERVICIOS_FAKE[0],
  operadorNombre: 'Juan Pérez',
  operadorTelefono: '+54 9 11 1234-5678',
  unidadPlaca: 'GRU-001',
  horaInicio: '09:00',
  horaFin: '11:00',
  duracionHoras: 2,
  tipoVehiculo: 'Sedán',
  placa: 'AB 123 CD',
  descripcionVehiculo: 'Toyota Corolla 2020 - Blanco',
  observaciones: '',
  trazabilidad: [
    { estado: 'Servicio Finalizado', descripcion: 'Confirmado por el operador en campo', fecha: '12/02/26', hora: '11:00 hs', color: 'green' },
    { estado: 'Facturación', descripcion: 'Registrada por administración', fecha: '14/02/26', hora: '10:00 hs', color: 'blue' },
    { estado: 'Pago Confirmado', descripcion: 'Validado por administración', fecha: '16/02/26', hora: '15:00 hs', color: 'orange' },
  ],
};

@Injectable({ providedIn: 'root' })
export class ServicioService {
  getServicios() {
    // TODO: reemplazar con this.http.get<Servicio[]>('/api/servicios')
    return of(SERVICIOS_FAKE).pipe(delay(300));
  }

  getDetalle(id: string) {
    // TODO: reemplazar con this.http.get<DetalleServicio>(`/api/servicios/${id}`)
    return of({ ...DETALLE_FAKE, id }).pipe(delay(300));
  }
}
