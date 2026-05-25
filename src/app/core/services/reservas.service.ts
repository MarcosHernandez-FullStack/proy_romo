import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DetalleServicio, Servicio } from '../../models/operaciones.model';
import { CrearReservaDto, ReservaResultado, ValidarHorarioDto } from '../../models/reservas.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly http    = inject(HttpClient);
  private readonly authSvc = inject(AuthService);

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

  getServicios(fechaInicio?: string, fechaFin?: string): Observable<Servicio[]> {
    const params: Record<string, string> = {};
    const idCliente = this.authSvc.session()?.idCliente;
    if (idCliente)   params['idCliente']          = String(idCliente);
    if (fechaInicio) params['fechaServicioInicio'] = fechaInicio;
    if (fechaFin)    params['fechaServicioFin']    = fechaFin;
    return this.http.get<Servicio[]>(`${API}/operaciones`, { params }).pipe(
      map(data => data ?? [])
    );
  }

  getDetalle(id: number): Observable<DetalleServicio> {
    return this.http.get<DetalleServicio[]>(`${API}/operaciones`, { params: { id: String(id) } }).pipe(
      map(data => data[0])
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
