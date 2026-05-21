import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BitaMantApiItem, BitacoraEntry, DisponibilidadGrua, EstadoUnidad, GruaApiItem, GruaRequest, IngresoTallerRequest, RetornoOperativaRequest, UnidadFlota } from '../../models/flota.model';
import { ReservaALiberar } from '../../models/operaciones.model';
import { CrearUsuarioResult } from '../../models/usuario.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class FlotaService {
  private readonly http = inject(HttpClient);

  getFlota(): Observable<UnidadFlota[]> {
    return this.http.get<GruaApiItem[]>(`${API}/flota`).pipe(
      map(items => items.map(i => this.mapGrua(i)))
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

  getBitacora(unidadId: string): Observable<BitacoraEntry[]> {
    const idNumerico = parseInt(unidadId.split('-')[1], 10);
    return this.http.get<BitaMantApiItem[]>(`${API}/flota/${idNumerico}/bitacora`).pipe(
      map(items => items.map(i => ({
        tipo:        i.titulo,
        fecha:       i.fechaCreacion,
        responsable: i.responsable,
        kilometraje: i.kilometraje,
        nota:        i.nota ?? '',
      })))
    );
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

  private mapGrua(item: GruaApiItem): UnidadFlota {
    return {
      id:                `GRU-${String(item.id).padStart(3, '0')}`,
      placa:             item.placa,
      marca:             item.marca,
      modelo:            item.modelo,
      anio:              item.añoFabricacion,
      capacidad:         item.capacidad,
      vencimientoSeguro: this.parseFecVenSeg(item.fecVenSeg),
      estado:            this.mapEstadoGrua(item.estado, item.estadoOperacion),
    };
  }

  private mapEstadoGrua(estado: string, estadoOperacion: string): EstadoUnidad {
    if (estado?.toUpperCase() === 'INACTIVO') return 'Baja';
    if (estadoOperacion?.toUpperCase() === 'ENTALLER') return 'En Taller';
    return 'Operativa';
  }

  private parseFecVenSeg(fec: string | null): string {
    if (!fec) return '';
    const [d, m, y] = fec.split('/');
    return `${y}-${m}-${d}`;
  }
}

