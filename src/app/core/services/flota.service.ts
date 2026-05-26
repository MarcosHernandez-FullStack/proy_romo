import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BitacoraEntry, DisponibilidadGrua, GetGruasParams, GruaPagedDto, GruaRequest, IngresoTallerRequest, RetornoOperativaRequest } from '../../models/flota.model';
import { ReservaALiberar } from '../../models/operaciones.model';
import { CrearUsuarioResult } from '../../models/usuario.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

const EMPTY_PAGED: GruaPagedDto = {
  total: 0, operativas: 0, enTaller: 0, segurosCriticos: 0, datos: [],
};

@Injectable({ providedIn: 'root' })
export class FlotaService {
  private readonly http = inject(HttpClient);

  getGruas(params: GetGruasParams = {}): Observable<GruaPagedDto> {
    const p: Record<string, string> = {};
    if (params.estado          != null) p['estado']          = params.estado;
    if (params.estadoOperacion != null) p['estadoOperacion'] = params.estadoOperacion;
    if (params.id              != null) p['id']              = String(params.id);
    if (params.placa           != null) p['placa']           = params.placa;
    if (params.marca           != null) p['marca']           = params.marca;
    if (params.modelo          != null) p['modelo']          = params.modelo;
    if (params.pagina          != null) p['pagina']          = String(params.pagina);
    if (params.tamano          != null) p['tamano']          = String(params.tamano);
    return this.http.get<GruaPagedDto | null>(`${API}/flota`, { params: p }).pipe(
      map(res => res ?? 
        {
          total: 0, operativas: 0, enTaller: 0, segurosCriticos: 0, datos: [],
        }
      ),
    );
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
