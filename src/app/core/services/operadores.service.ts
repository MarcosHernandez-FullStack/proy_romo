import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { DIAS_SEMANA, DiaSemana, GridDisponibilidad, HoraGrid, HORAS_GRID } from '../../models/agenda.model';
import { CrearOperadorRequest, DispOperador, DispRango, DispResult, EditarOperadorRequest, Operador, OperadorApiItem, ProxServApiItem, ServicioProximo, TipoDisponibilidad } from '../../models/operadores.model';
import { CrearUsuarioResult } from '../../models/usuario.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class OperadoresService {
  private readonly http = inject(HttpClient);

  getOperadores(estado?: string): Observable<Operador[]> {
    const params: Record<string, string> = {};
    if (estado) params['estado'] = estado;
    return this.http.get<OperadorApiItem[]>(`${API}/Operadores`, { params }).pipe(
      map(items => items.map(r => this.mapOperador(r))),
      catchError(() => of(OPERADORES))
    );
  }

  crearOperador(data: CrearOperadorRequest): Observable<CrearUsuarioResult> {
    return this.http.post<CrearUsuarioResult>(`${API}/Operadores`, data);
  }

  editarOperador(idOperador: number, data: EditarOperadorRequest): Observable<CrearUsuarioResult> {
    return this.http.put<CrearUsuarioResult>(`${API}/Operadores/${idOperador}`, data);
  }

  actualizarEstadoOperador(idOperador: number, nuevoEstado: 'ACTIVO' | 'INACTIVO'): Observable<CrearUsuarioResult> {
    return this.http.patch<CrearUsuarioResult>(`${API}/Operadores/${idOperador}/estado`, { nuevoEstado });
  }

  getServiciosOperador(idOperador: number): Observable<ServicioProximo[]> {
    return this.http.get<ProxServApiItem[]>(`${API}/Operadores/${idOperador}/proximos-servicios`).pipe(
      map(items => items.map(r => ({
        id:      `SRV-${String(r.id).padStart(3, '0')}`,
        fecha:   r.fechaAbreviada,
        hora:    r.horaInicio,
        cliente: r.nomCliente,
      }))),
      catchError(() => of([]))
    );
  }

  getDispOperador(idOperador: number): Observable<DispOperador> {
    return this.http.get<DispOperador>(`${API}/Operadores/${idOperador}/disponibilidad`);
  }

  guardarDispOperador(idOperador: number, disponibilidad: DispRango[], confirmar: boolean): Observable<DispResult> {
    return this.http.post<DispResult>(
      `${API}/Operadores/${idOperador}/disponibilidad`,
      { disponibilidad, confirmar }
    );
  }

  private mapOperador(r: OperadorApiItem): Operador {
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    let proximoServicio: Operador['proximoServicio'] = null;
    if (r.proximaFechaServicio) {
      const d    = new Date(r.proximaFechaServicio);
      const fecha = `${d.getUTCDate()} ${meses[d.getUTCMonth()]}`;
      const hora  = (r.proximaHoraServicio ?? '').substring(0, 5);
      proximoServicio = { fecha, hora };
    }
    const tipo: TipoDisponibilidad =
      r.totalHorasSemanales >= 40 ? 'Tiempo Completo' :
      r.totalHorasSemanales  >  0 ? 'Horario Parcial'  : 'Personalizado';

    return {
      id:                  `OP-${String(r.id).padStart(3, '0')}`,
      nombre:              r.nombresCompleto,
      nombres:             r.nombres,
      apellidos:           r.apellidos,
      correo:              r.correo,
      telefono:            r.telefono ?? '',
      loginId:             r.alias,
      password:            '',
      licencia:            r.nroLicencia,
      vencimientoLicencia: r.fecVenLic,
      proximoServicio,
      serviciosAsignados:  [],
      tipoDisponibilidad:  tipo,
      disponibilidad:      this.emptyGrid(),
      activo:              r.estado === 'ACTIVO',
    };
  }

  private emptyGrid(): GridDisponibilidad {
    const grid = {} as GridDisponibilidad;
    for (const dia of DIAS_SEMANA) {
      grid[dia] = {} as Record<HoraGrid, boolean>;
      for (const hora of HORAS_GRID) grid[dia][hora] = false;
    }
    return grid;
  }
}

function buildGrid(diasActivos: DiaSemana[], horasActivas: HoraGrid[]): GridDisponibilidad {
  const grid = {} as GridDisponibilidad;
  for (const dia of DIAS_SEMANA) {
    grid[dia] = {} as Record<HoraGrid, boolean>;
    for (const hora of HORAS_GRID) {
      grid[dia][hora] = diasActivos.includes(dia) && horasActivas.includes(hora);
    }
  }
  return grid;
}

const DIAS_LAB: DiaSemana[]   = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const HORAS_COMPLETO: HoraGrid[] = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const HORAS_MANANA: HoraGrid[]   = ['08:00','09:00','10:00','11:00','12:00'];
const HORAS_TARDE: HoraGrid[]    = ['13:00','14:00','15:00','16:00','17:00'];

const OPERADORES: Operador[] = [
  {
    id: 'OP-001', nombre: 'Roberto Sánchez', nombres: 'Roberto', apellidos: 'Sánchez',
    correo: 'roberto.sanchez@romo.com', telefono: '+54 11 2222-3333', loginId: 'OPER001', password: 'driver123',
    licencia: 'D-12345678', vencimientoLicencia: '2025-06-14',
    proximoServicio: { fecha: '03 mar', hora: '14:00' },
    serviciosAsignados: [
      { id: 'SRV-001', fecha: '03 mar', hora: '14:00', cliente: 'Transportes XYZ S.A.' },
      { id: 'SRV-002', fecha: '04 mar', hora: '09:00', cliente: 'Logística ABC Ltda.' },
    ],
    tipoDisponibilidad: 'Tiempo Completo', disponibilidad: buildGrid(DIAS_LAB, HORAS_COMPLETO), activo: true,
  },
  {
    id: 'OP-002', nombre: 'Fernando López', nombres: 'Fernando', apellidos: 'López',
    correo: 'fernando.lopez@romo.com', telefono: '+54 11 3333-4444', loginId: 'OPER002', password: 'driver456',
    licencia: 'D-87654321', vencimientoLicencia: '2025-08-19',
    proximoServicio: { fecha: '04 mar', hora: '11:00' },
    serviciosAsignados: [{ id: 'SRV-005', fecha: '04 mar', hora: '11:00', cliente: 'Logística Beta Ltda.' }],
    tipoDisponibilidad: 'Horario Parcial', disponibilidad: buildGrid(DIAS_LAB, HORAS_MANANA), activo: true,
  },
  {
    id: 'OP-003', nombre: 'Martín Gómez', nombres: 'Martín', apellidos: 'Gómez',
    correo: 'martin.gomez@romo.com', telefono: '+54 11 4444-5555', loginId: 'OPER003', password: 'driver789',
    licencia: 'D-11223344', vencimientoLicencia: '2024-02-09',
    proximoServicio: null, serviciosAsignados: [],
    tipoDisponibilidad: 'Personalizado', disponibilidad: buildGrid(['Lun', 'Mié', 'Vie'], HORAS_TARDE), activo: true,
  },
  {
    id: 'OP-004', nombre: 'Carlos Morales', nombres: 'Carlos', apellidos: 'Morales',
    correo: 'carlos.morales@romo.com', telefono: '+54 11 5555-6666', loginId: 'OPER004', password: 'driver000',
    licencia: 'D-99887766', vencimientoLicencia: '2025-01-14',
    proximoServicio: null, serviciosAsignados: [],
    tipoDisponibilidad: 'Horario Parcial', disponibilidad: buildGrid(DIAS_LAB, HORAS_MANANA), activo: false,
  },
];
