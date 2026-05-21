import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DetalleServicio, EstadoAdminServicio, EstadoOperativo, Servicio, TrazabilidadItem, VehiculoDetalle } from '../../models/operaciones.model';
import { CrearReservaDto, ReservaApiItem, ReservaResultado, ValidarHorarioDto } from '../../models/reservas.model';
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
    return this.http.get<ReservaApiItem[]>(`${API}/operaciones`, { params }).pipe(
      map(data => (data ?? []).map(r => this.mapServicio(r)))
    );
  }

  getDetalle(id: string): Observable<DetalleServicio> {
    return this.http.get<ReservaApiItem[]>(`${API}/operaciones`, { params: { id } }).pipe(
      map(data => this.mapDetalle(data[0]))
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private toDateStr(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private mapServicio(r: ReservaApiItem): Servicio {
    const partes = r.fechaHoraFormateada?.split(' · ') ?? [];
    return {
      id:              String(r.id),
      fecha:           partes[0] ?? '',
      hora:            partes[1] ?? '',
      origen:          r.direccionOrigen,
      destino:         r.direccionDestino,
      vehiculos:       r.cantidadVehiculos,
      costo:           r.costo,
      estadoOperativo: this.mapEstadoOp(r.estadoOperacion),
      estadoAdmin:     this.mapEstadoAdmin(r.estadoAdministrativo),
    };
  }

  private mapDetalle(r: ReservaApiItem): DetalleServicio {
    return {
      ...this.mapServicio(r),
      operadorNombre:   r.operadorAsignado ?? '',
      operadorTelefono: '',
      unidadPlaca:      r.gruaAsignada?.split(' - ')[0] ?? '',
      horaInicio:       r.horaInicio?.substring(0, 5) ?? '',
      horaFin:          r.horaFin?.substring(0, 5)    ?? '',
      duracionHoras:    r.nroBloques,
      vehiculosDetalle: (r.vehiculos ?? []).map<VehiculoDetalle>(v => ({
        tipo:        v.tipo        ?? '',
        placa:       v.placa       ?? '',
        modelo:      v.modelo      ?? '',
        observacion: v.observacion ?? '',
      })),
      trazabilidad: this.buildTrazabilidad(r),
    };
  }

  private buildTrazabilidad(r: ReservaApiItem): TrazabilidadItem[] {
    const items: TrazabilidadItem[] = [];
    const estadoOp    = this.mapEstadoOp(r.estadoOperacion);
    const estadoAdmin = this.mapEstadoAdmin(r.estadoAdministrativo);

    const estadoLabel: Record<EstadoOperativo, string> = {
      'Reservado':  'Servicio Reservado',
      'Asignado':   'Servicio Asignado',
      'En Curso':   'Servicio En Curso',
      'Finalizado': 'Servicio Finalizado',
    };
    const estadoColor: Record<EstadoOperativo, 'green' | 'blue' | 'orange'> = {
      'Reservado':  'orange',
      'Asignado':   'blue',
      'En Curso':   'orange',
      'Finalizado': 'green',
    };

    items.push({
      estado:      estadoLabel[estadoOp],
      descripcion: estadoOp === 'Finalizado' ? 'Confirmado por el operador en campo' : `En estado ${estadoOp}`,
      fecha: '', hora: '', color: estadoColor[estadoOp],
    });

    if (estadoAdmin === 'Facturado' || estadoAdmin === 'Pagado') {
      items.push({ estado: 'Facturación', descripcion: 'Registrada por administración', fecha: '', hora: '', color: 'blue' });
    }
    if (estadoAdmin === 'Pagado') {
      items.push({ estado: 'Pago Confirmado', descripcion: 'Validado por administración', fecha: '', hora: '', color: 'orange' });
    }
    return items;
  }

  private mapEstadoOp(e: string): EstadoOperativo {
    const tabla: Record<string, EstadoOperativo> = {
      RESERVADO:  'Reservado',
      ASIGNADO:   'Asignado',
      ENCURSO:    'En Curso',
      FINALIZADO: 'Finalizado',
    };
    return tabla[e?.toUpperCase()] ?? 'Reservado';
  }

  private mapEstadoAdmin(e: string): EstadoAdminServicio {
    const tabla: Record<string, EstadoAdminServicio> = {
      PENDIENTE: 'Pendiente',
      FACTURADO: 'Facturado',
      PAGADO:    'Pagado',
    };
    return tabla[e?.toUpperCase()] ?? 'Pendiente';
  }
}

