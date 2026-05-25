import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BitacoraEntry, DisponibilidadGrua, GruaRequest, IngresoTallerRequest, RetornoOperativaRequest, UnidadFlota } from '../../models/flota.model';
import { ReservaALiberar } from '../../models/operaciones.model';
import { CrearUsuarioResult } from '../../models/usuario.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class FlotaService {
  private readonly http = inject(HttpClient);

  getFlota(): Observable<UnidadFlota[]> {
    return this.http.get<UnidadFlota[]>(`${API}/flota`);
  }

  crearGrua(data: GruaRequest): Observable<CrearUsuarioResult> {
    return this.http.post<CrearUsuarioResult>(`${API}/flota`, data);
  }

  editarGrua(idGrua: number, data: GruaRequest): Observable<CrearUsuarioResult> {
    return this.http.put<CrearUsuarioResult>(`${API}/flota/${idGrua}`, data);
  }

  actualizarEstadoGrua(idGrua: number, nuevoEstado: 'ACTIVO' | 'INACTIVO'): Observable<CrearUsuarioResult> {
    return this.http.patch<CrearUsuarioResult>(`${API}/flota/${idGrua}/estado`, { nuevoEstado });
  }

  getBitacora(idGrua: number): Observable<BitacoraEntry[]> {
    return this.http.get<BitacoraEntry[]>(`${API}/flota/${idGrua}/bitacora`);
  }

  getReservasALiberar(idGrua: number): Observable<ReservaALiberar[]> {
    return this.http.get<ReservaALiberar[]>(`${API}/flota/${idGrua}/reservas-a-liberar`).pipe(
      map(data => data ?? [])
    );
  }

  ingresoTaller(idGrua: number, body: IngresoTallerRequest): Observable<CrearUsuarioResult> {
    return this.http.put<CrearUsuarioResult>(`${API}/flota/${idGrua}/taller`, body);
  }

  retornoOperativa(idGrua: number, body: RetornoOperativaRequest): Observable<CrearUsuarioResult> {
    return this.http.put<CrearUsuarioResult>(`${API}/flota/${idGrua}/operativa`, body);
  }

  getCapacidadesGruas(): Observable<number[]> {
    return this.http.get<number[]>(`${API}/operaciones/capacidades-gruas`);
  }

  getDisponibilidadGruas(fechaServicio: string, capacidad?: number): Observable<DisponibilidadGrua[]> {
    const params: Record<string, string> = { fechaServicio };
    if (capacidad !== undefined) params['capacidad'] = String(capacidad);
    return this.http.get<DisponibilidadGrua[]>(`${API}/operaciones/disponibilidad-gruas`, { params });
  }
}
