import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { AgendaExcepcionResult, CrearUpdExcepcionDto, ExcepcionAgenda, HorarioApiItem, HorarioRegular } from '../../models/agenda.model';
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
    return this.http.get<HorarioApiItem[]>(`${API}/agenda/horarios`, { params: { rol: 'CLIENTE' } }).pipe(
      map(items => items.map(i => ({
        id:     i.id,
        dia:    i.nombreDia,
        abre:   i.horaInicio,
        cierra: i.horaFinal,
        activo: i.estado === 'ACTIVO',
      }))),
      catchError(() => of(HORARIOS_REGULARES))
    );
  }

  guardarHorariosRegulares(horarios: HorarioRegular[]): Observable<{ exitoso: number; mensaje: string }> {
    const body = {
      horarios: horarios.map(h => ({
        id:         h.id,
        estado:     h.activo ? 'ACTIVO' : 'INACTIVO',
        horaInicio: h.abre,
        horaFinal:  h.cierra,
      })),
    };
    return this.http.put<{ exitoso: number; mensaje: string }>(`${API}/agenda/horarios`, body);
  }
}

const HORARIOS_REGULARES: HorarioRegular[] = [
  { id: 1, dia: 'Lunes',     abre: '07:00', cierra: '20:00', activo: true  },
  { id: 2, dia: 'Martes',    abre: '07:00', cierra: '20:00', activo: true  },
  { id: 3, dia: 'Miércoles', abre: '07:00', cierra: '20:00', activo: true  },
  { id: 4, dia: 'Jueves',    abre: '07:00', cierra: '20:00', activo: true  },
  { id: 5, dia: 'Viernes',   abre: '07:00', cierra: '20:00', activo: true  },
  { id: 6, dia: 'Sábado',    abre: '08:00', cierra: '14:00', activo: true  },
  { id: 7, dia: 'Domingo',   abre: '00:00', cierra: '00:00', activo: false },
];
