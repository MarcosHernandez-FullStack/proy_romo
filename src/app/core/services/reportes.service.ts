import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { EstadoAdminServicio, EstadoServicioAdmin } from '../../models/operaciones.model';
import { ServicioReporte } from '../../models/reportes.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);

  getReportes(): Observable<ServicioReporte[]> {
    return this.http.get<any[]>(`${API}/reportes`).pipe(
      map(data => data.map(r => this.mapReporte(r)))
    );
  }

  updEstadoAdministrativo(idReserva: number, estado: EstadoAdminServicio): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.put<{ exitoso: number; mensaje: string }>(
      `${API}/reportes/${idReserva}/estado-administrativo`,
      { estadoAdministrativo: estado.toUpperCase() }
    );
  }

  private mapReporte(r: any): ServicioReporte {
    return {
      id:                   r.id,
      cliente:              r.cliente,
      costo:                r.costo,
      origen:               r.origen,
      destino:              r.destino,
      distanciaKm:          r.distanciaKm,
      fecha:                r.fecha,
      hora:                 r.hora,
      tiempoMin:            r.tiempoMin,
      bloques:              r.bloques,
      carga:                String(r.cantidadCarga ?? 0),
      vehiculos:            0,
      operador:             r.operador ?? null,
      unidad:               r.unidad   ?? null,
      estado:               this.mapEstadoOper(r.estado),
      estadoAdministrativo: this.mapEstadoAdmin(r.estadoAdministrativo),
      fechaCompleta:        r.fechaCompleta,
      fechaCorta:           r.fechaCorta,
      grua:                 r.grua,
      motivoCancelacion:    r.motivoCancelacion ?? null,
      canceladoPor:         r.canceladoPor      ?? null,
    };
  }

  private mapEstadoOper(e: string): EstadoServicioAdmin {
    const tabla: Record<string, EstadoServicioAdmin> = {
      RESERVADO:  'Reservado',
      ASIGNADO:   'Asignado',
      ENCURSO:    'En Curso',
      FINALIZADO: 'Finalizado',
      CANCELADO:  'Cancelado',
    };
    return tabla[e?.toUpperCase()] ?? 'Finalizado';
  }

  private mapEstadoAdmin(e: string): EstadoAdminServicio {
    const tabla: Record<string, EstadoAdminServicio> = {
      PENDIENTE: 'Pendiente',
      FACTURADO: 'Facturado',
      PAGADO:    'Pagado',
    };
    return tabla[e?.toUpperCase()] ?? 'Pendiente';
  }
}
