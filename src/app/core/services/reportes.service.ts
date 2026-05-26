import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { GetReportesParams, ReportePagedDto } from '../../models/reportes.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);

  getReportes(params: GetReportesParams = {}): Observable<ReportePagedDto> {
    let qp = new HttpParams();
    if (params.id                   != null)  qp = qp.set('id',                    params.id);
    if (params.idCliente            != null)  qp = qp.set('idCliente',             params.idCliente);
    if (params.fechaDesde)                    qp = qp.set('fechaDesde',            params.fechaDesde);
    if (params.fechaHasta)                    qp = qp.set('fechaHasta',            params.fechaHasta);
    if (params.estadoOperacion)               qp = qp.set('estadoOperacion',       params.estadoOperacion);
    if (params.estadoAdministrativo)          qp = qp.set('estadoAdministrativo',  params.estadoAdministrativo);
    if (params.placa)                         qp = qp.set('placa',                 params.placa);
    if (params.empresa)                       qp = qp.set('empresa',               params.empresa);
    if (params.pagina    != null)             qp = qp.set('pagina',                params.pagina);
    if (params.tamano    != null)             qp = qp.set('tamano',                params.tamano);

    return this.http.get<ReportePagedDto>(`${API}/reportes`, { params: qp }).pipe(
      map(data => data ?? 
        {
          total: 0, finalizados: 0, cancelados: 0, montoTotal: 0,
          pendientes: 0, facturados: 0, pagados: 0, datos: [],
        }
      )
    );
  }

  updEstadoAdministrativo(idReserva: number, estado: string): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.put<{ exitoso: number; mensaje: string }>(
      `${API}/reportes/${idReserva}/estado-administrativo`,
      { estadoAdministrativo: estado }
    );
  }
}
