import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ServicioReporte } from '../../models/reportes.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);

  getReportes(): Observable<ServicioReporte[]> {
    return this.http.get<ServicioReporte[]>(`${API}/reportes`).pipe(
      map(data => data ?? [])
    );
  }

  updEstadoAdministrativo(idReserva: number, estado: string): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.put<{ exitoso: number; mensaje: string }>(
      `${API}/reportes/${idReserva}/estado-administrativo`,
      { estadoAdministrativo: estado }
    );
  }
}
