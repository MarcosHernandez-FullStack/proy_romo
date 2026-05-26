import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { AgendaExcepcionResult, CrearUpdExcepcionDto, ExcepcionPagedDto, GetExcepcionesParams, HorarioRegular } from '../../models/agenda.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly http = inject(HttpClient);

  getExcepciones(params: GetExcepcionesParams = {}): Observable<ExcepcionPagedDto> {
    const p: Record<string, string> = {};
    p['estado'] = 'ACTIVO';
    if (params.motivo              != null) p['motivo']              = params.motivo;
    if (params.fechaInicio != null) p['fechaInicio'] = params.fechaInicio;
    if (params.fechaFin    != null) p['fechaFin']    = params.fechaFin;
    if (params.pagina              != null) p['pagina']              = String(params.pagina);
    if (params.tamano              != null) p['tamano']              = String(params.tamano);
    return this.http.get<ExcepcionPagedDto | null>(`${API}/agenda/excepciones`, { params: p }).pipe(
      map(res => res ?? { total: 0, datos: [] })
    );
  }

  crearUpdExcepcion(dto: CrearUpdExcepcionDto): Observable<AgendaExcepcionResult> {
    return this.http.post<AgendaExcepcionResult>(`${API}/agenda/excepciones`, dto);
  }

  updEstadoExcepcion(id: number, nuevoEstado: string): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.patch<{ exitoso: number; mensaje: string }>(`${API}/agenda/excepciones/${id}/estado`, { nuevoEstado });
  }

  getHorariosRegulares(): Observable<HorarioRegular[]> {
    return this.http.get<HorarioRegular[]>(`${API}/agenda/horarios`, { params: { rol: 'CLIENTE' } }).pipe(
      map(items => items ?? []),
      catchError(() => of(HORARIOS_REGULARES))
    );
  }

  guardarHorariosRegulares(horarios: HorarioRegular[]): Observable<{ exitoso: number; mensaje: string }> {
    const body = {
      horarios: horarios.map(h => ({
        id:         h.id,
        estado:     h.estado,
        horaInicio: h.horaInicio,
        horaFinal:  h.horaFinal,
      })),
    };
    return this.http.put<{ exitoso: number; mensaje: string }>(`${API}/agenda/horarios`, body);
  }
}

const HORARIOS_REGULARES: HorarioRegular[] = [
  { id: 1, nroDia: 1, nombreDia: 'Lunes',     estado: 'ACTIVO',   horaInicio: '07:00', horaFinal: '20:00' },
  { id: 2, nroDia: 2, nombreDia: 'Martes',    estado: 'ACTIVO',   horaInicio: '07:00', horaFinal: '20:00' },
  { id: 3, nroDia: 3, nombreDia: 'Miércoles', estado: 'ACTIVO',   horaInicio: '07:00', horaFinal: '20:00' },
  { id: 4, nroDia: 4, nombreDia: 'Jueves',    estado: 'ACTIVO',   horaInicio: '07:00', horaFinal: '20:00' },
  { id: 5, nroDia: 5, nombreDia: 'Viernes',   estado: 'ACTIVO',   horaInicio: '07:00', horaFinal: '20:00' },
  { id: 6, nroDia: 6, nombreDia: 'Sábado',    estado: 'ACTIVO',   horaInicio: '08:00', horaFinal: '14:00' },
  { id: 7, nroDia: 7, nombreDia: 'Domingo',   estado: 'INACTIVO', horaInicio: '00:00', horaFinal: '00:00' },
];
