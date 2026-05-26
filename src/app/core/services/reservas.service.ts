import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DetalleServicio, GetServiciosParams, ReservaPagedDto } from '../../models/operaciones.model';
import { CrearReservaDto, ReservaResultado, ValidarHorarioDto } from '../../models/reservas.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly http = inject(HttpClient);

  // ── Agenda admin ──────────────────────────────────────────────────────────

  getHorarios(fecha: Date, rol: string, capacidad: number): Observable<{ hora: string; estado: string }[]> {
    const fechaStr = this.toDateStr(fecha);
    return this.http.get<{ hora: string; estado: string }[]>(
      `${API}/reservas/horarios`,
      { params: { fecha: fechaStr, rol, capacidad: capacidad.toString() } }
    );
  }

  getHorariosReprogramacion(fecha: Date, rol: string, capacidad: number, idReserva: number): Observable<{ hora: string; estado: string }[]> {
    const fechaStr = this.toDateStr(fecha);
    return this.http.get<{ hora: string; estado: string }[]>(
      `${API}/reservas/horarios-reprogramacion`,
      { params: { fecha: fechaStr, rol, capacidad: capacidad.toString(), idReserva: idReserva.toString() } }
    );
  }

  deleteTimer(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/reservas/timer/${id}`);
  }

  validarHorario(dto: ValidarHorarioDto): Observable<ReservaResultado> {
    return this.http.post<ReservaResultado>(`${API}/reservas/validar-horario`, dto);
  }

  crearReserva(dto: CrearReservaDto): Observable<ReservaResultado> {
    return this.http.post<ReservaResultado>(`${API}/reservas/crear-reserva`, dto);
  }

  // ── Vista cliente ─────────────────────────────────────────────────────────

  getServicios(params: GetServiciosParams = {}): Observable<ReservaPagedDto> {
    let qp = new HttpParams();
    if (params.id                   != null)  qp = qp.set('id',                    params.id);
    if (params.estadoOperacion)               qp = qp.set('estadoOperacion',       params.estadoOperacion);
    if (params.estadoAdministrativo)          qp = qp.set('estadoAdministrativo',  params.estadoAdministrativo);
    if (params.fechaInicio)                   qp = qp.set('fechaInicio',           params.fechaInicio);
    if (params.fechaFin)                      qp = qp.set('fechaFin',              params.fechaFin);
    if (params.direccion)                     qp = qp.set('direccion',             params.direccion);
    if (params.pagina               != null)  qp = qp.set('pagina',                params.pagina);
    if (params.tamano               != null)  qp = qp.set('tamano',                params.tamano);

    return this.http.get<ReservaPagedDto>(`${API}/operaciones`, { params: qp }).pipe(
      map(data => data ?? 
        {
          total: 0, totalReservado: 0, totalAsignado: 0, totalEnCurso: 0,
          montoPendiente: 0, montoLiquidado: 0, datos: [],
        }
      )
    );
  }

  getDetalle(id: number): Observable<DetalleServicio> {
    return this.http.get<ReservaPagedDto>(`${API}/operaciones`, { params: { id: String(id) } }).pipe(
      map(data => data.datos[0] as unknown as DetalleServicio)
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private toDateStr(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
