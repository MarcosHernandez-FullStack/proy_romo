import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { GetReservasParams, ReservaPagedDto, ServicioAdmin, Sugerencias } from '../../models/operaciones.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class OperacionesService {
  private readonly http = inject(HttpClient);

  getReservas(params: GetReservasParams = {}): Observable<ReservaPagedDto> {
    const p: Record<string, string> = {};
    if (params.estadoOperacion)       p['estadoOperacion'] = params.estadoOperacion;
    if (params.id != null)            p['id']              = String(params.id);
    if (params.fechaInicio)           p['fechaInicio']     = params.fechaInicio;
    if (params.fechaFin)              p['fechaFin']        = params.fechaFin;
    if (params.idGrua != null)        p['idGrua']          = String(params.idGrua);
    if (params.pagina != null)        p['pagina']          = String(params.pagina);
    if (params.tamano != null)        p['tamano']          = String(params.tamano);
    return this.http.get<ReservaPagedDto | null>(`${API}/operaciones`, { params: p }).pipe(
      map(res => res ??
        {
          total: 0, datos: [], totalReservado: 0, totalAsignado: 0, totalEnCurso: 0,
          montoPendiente: 0, montoLiquidado: 0,
        })
    );
  }

  getSugerencias(idReserva: number): Observable<Sugerencias> {
    return this.http.get<Sugerencias>(`${API}/operaciones/sugerencias`, {
      params: { idReserva: String(idReserva) },
    });
  }

  asignarServicio(idReserva: number, idGrua: number, idOperador: number): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.patch<{ exitoso: number; mensaje: string }>(`${API}/operaciones/asignar`, { idReserva, idGrua, idOperador });
  }

  cancelarReserva(id: number, motivoCancelacion: string): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.patch<{ exitoso: number; mensaje: string }>(`${API}/operaciones/cancelar`, { id, motivoCancelacion });
  }

  reprogramarReserva(idReserva: number, nuevaFecha: string, nuevaHoraInicio: string, nuevoNroBloques: number): Observable<{ exitoso: number; mensaje: string; horasConflicto?: string }> {
    return this.http.patch<{ exitoso: number; mensaje: string; horasConflicto?: string }>(`${API}/operaciones/reprogramar`, {
      idReserva, nuevaFecha, nuevaHoraInicio, nuevoNroBloques,
    });
  }

  // TODO: reemplazar con endpoint real
  getOperaciones(): Observable<ServicioAdmin[]> {
    return of(SERVICIOS_ADMIN).pipe(delay(300));
  }
}

const SERVICIOS_ADMIN: ServicioAdmin[] = [
  {
    id: 1, cliente: 'Transportes XYZ S.A.', costo: 562.5,
    origen: 'Av. Corrientes 1234, CABA', destino: 'Av. Libertador 5678, Vicente López',
    distanciaKm: 12.5, fecha: '4/2/2024', hora: '10:00', tiempoMin: 80, bloques: 2,
    cantidadCarga: 1, operador: null, unidad: null, estado: 'RESERVADO',
  },
  {
    id: 2, cliente: 'Logística Beta Ltda.', costo: 420.0,
    origen: 'Av. Santa Fe 2000, CABA', destino: 'Av. Maipú 300, Olivos',
    distanciaKm: 8.3, fecha: '4/2/2024', hora: '11:00', tiempoMin: 60, bloques: 2,
    cantidadCarga: 1, operador: 'Roberto Sánchez', unidad: 'GRU-001', estado: 'ASIGNADO',
  },
  {
    id: 3, cliente: 'Distribuidora Central', costo: 890.0,
    origen: 'Av. Cabildo 500, CABA', destino: 'Ruta 8 km 40, Pilar',
    distanciaKm: 25.0, fecha: '4/2/2024', hora: '09:00', tiempoMin: 120, bloques: 3,
    cantidadCarga: 2, operador: 'Fernando López', unidad: 'GRU-002', estado: 'ENCURSO',
  },
];
