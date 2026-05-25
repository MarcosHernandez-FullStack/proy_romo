import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { AgendaExcepcionResult, CrearUpdExcepcionDto, ExcepcionAgenda, HorarioRegular } from '../../models/agenda.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly http = inject(HttpClient);

  getExcepciones(estado?: string): Observable<ExcepcionAgenda[]> {
    const params: Record<string, string> = {};
    if (estado) params['estado'] = estado;
    return this.http.get<ExcepcionAgenda[]>(`${API}/agenda/excepciones`, { params }).pipe(
      map(data => data ?? []),
      catchError(() => of([]))
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
