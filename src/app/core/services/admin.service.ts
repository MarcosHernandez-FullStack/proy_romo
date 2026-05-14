import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import {
  BitacoraEntry,
  ClienteB2B,
  CrearOperadorRequest,
  CrearUsuarioResult,
  EditarOperadorRequest,
  GruaRequest,
  EstadoAdminServicio,
  EstadoServicioAdmin,
  EstadoUnidad,
  DIAS_SEMANA,
  DiaSemana,
  DispOperador,
  DispRango,
  DispResult,
  DisponibilidadGrua,
  ExcepcionAgenda,
  GridDisponibilidad,
  HoraGrid,
  HorarioRegular,
  HORAS_GRID,
  Operador,
  ParametrosOperativos,
  ReservaALiberar,
  ReservaOperacion,
  ServicioAdmin,
  ServicioProximo,
  ServicioReporte,
  Sugerencias,
  TarifaCliente,
  TarifaGlobal,
  TipoDisponibilidad,
  UnidadFlota,
  UsuarioAdmin,
} from '../../models/admin.model';
import { LoginRequest, LoginResponse } from '../../models/auth.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;
const STORAGE_KEY = 'crane_admin';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly _session = signal<LoginResponse | null>(this.loadSession());

  readonly session = this._session.asReadonly();

  loginAdmin(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { identificador: email, contrasena: password };
    return this.http.post<LoginResponse>(`${API}/auth/login`, body).pipe(
      tap(res => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        this._session.set(res);
      })
    );
  }

  logoutAdmin(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._session.set(null);
    this.router.navigate(['/admin/login']);
  }

  isAdminLoggedIn(): boolean {
    return this._session() !== null;
  }

  getToken(): string | null {
    return this._session()?.token ?? null;
  }

  private loadSession(): LoginResponse | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const session: LoginResponse = JSON.parse(stored);
      if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  getHorarios(fecha: Date, rol: string, capacidad: number): Observable<{ hora: string; estado: string }[]> {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    const fechaStr = `${y}-${m}-${d}`;
    return this.http.get<{ hora: string; estado: string }[]>(
      `${API}/reservas/horarios`,
      { params: { fecha: fechaStr, rol, capacidad: capacidad.toString() } }
    );
  }

  getHorariosReprogramacion(fecha: Date, rol: string, capacidad: number, idReserva: number): Observable<{ hora: string; estado: string }[]> {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    const fechaStr = `${y}-${m}-${d}`;
    return this.http.get<{ hora: string; estado: string }[]>(
      `${API}/reservas/horarios-reprogramacion`,
      { params: { fecha: fechaStr, rol, capacidad: capacidad.toString(), idReserva: idReserva.toString() } }
    );
  }

  deleteTimer(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/reservas/timer/${id}`);
  }

  getReservas(fecha?: string, idGrua?: number): Observable<ReservaOperacion[]> {
    const params: Record<string, string> = {};
    if (fecha)   params['fechaServicio'] = fecha;
    if (idGrua)  params['idGrua']        = String(idGrua);
    return this.http.get<ReservaOperacion[]>(`${API}/operaciones`, { params }).pipe(
      map(data => data ?? [])
    );
  }

  getSugerencias(idReserva: number): Observable<Sugerencias> {
    return this.http.get<Sugerencias>(`${API}/operaciones/sugerencias`, {
      params: { idReserva: String(idReserva) },
    });
  }

  asignarServicio(idReserva: number, idGrua: number, idOperador: number): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.patch<{ exitoso: number; mensaje: string }>(`${API}/operaciones/asignar`, { idReserva, idGrua, idOperador });
  }

  cancelarReserva(id: number, motivoCancelacion: string): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.patch<{ exitoso: number; mensaje: string }>(`${API}/operaciones/cancelar`, { id, motivoCancelacion });
  }

  reprogramarReserva(idReserva: number, nuevaFecha: string, nuevaHoraInicio: string, nuevoNroBloques: number): Observable<{ exitoso: number; mensaje: string; horasConflicto?: string }> {
    return this.http.patch<{ exitoso: number; mensaje: string; horasConflicto?: string }>(`${API}/operaciones/reprogramar`, {
      idReserva, nuevaFecha, nuevaHoraInicio, nuevoNroBloques,
    });
  }

  getCapacidadesGruas(): Observable<number[]> {
    return this.http.get<number[]>(`${API}/operaciones/capacidades-gruas`);
  }

  getDisponibilidadGruas(fechaServicio: string, capacidad?: number): Observable<DisponibilidadGrua[]> {
    const params: Record<string, string> = { fechaServicio };
    if (capacidad !== undefined) params['capacidad'] = String(capacidad);
    return this.http.get<DisponibilidadGrua[]>(`${API}/operaciones/disponibilidad-gruas`, { params });
  }

  // TODO: reemplazar con this.http.get('/api/admin/operaciones')
  getOperaciones(): Observable<ServicioAdmin[]> {
    return of(SERVICIOS_ADMIN).pipe(delay(300));
  }

  crearCliente(data: CrearClienteRequest): Observable<CrearUsuarioResult> {
    return this.http.post<CrearUsuarioResult>(`${API}/clientes`, data);
  }

  editarCliente(idCliente: number, data: EditarClienteRequest): Observable<CrearUsuarioResult> {
    return this.http.put<CrearUsuarioResult>(`${API}/clientes/${idCliente}`, data);
  }

  getClientes(): Observable<ClienteB2B[]> {
    return this.http.get<ClienteApiItem[]>(`${API}/clientes`).pipe(
      map(data => data.map(c => ({
        id:             `CLI-${String(c.id).padStart(3, '0')}`,
        empresa:        c.empresa,
        contacto:       c.nomContacto,
        correo:         c.correoContacto,
        telefono:       c.nroContacto       ?? '',
        loginId:        c.alias,
        password:       c.contraseña        ?? '',
        tarifaBase:     c.tarifaBase,
        tarifaKm:       c.tarifaKm,
        tipoTarifaBase: (c.tipoTarifaBase as 'GLOBAL' | 'CUSTOM') || (c.tarifaBase === 0 ? 'GLOBAL' : 'CUSTOM'),
        tipoTarifaKm:   (c.tipoTarifaKm   as 'GLOBAL' | 'CUSTOM') || (c.tarifaKm   === 0 ? 'GLOBAL' : 'CUSTOM'),
        activo:         c.estado === 'ACTIVO',
      })))
    );
  }

  getOperadores(estado?: string): Observable<Operador[]> {
    const params: Record<string, string> = {};
    if (estado) params['estado'] = estado;

    return this.http.get<OperadorApiItem[]>(`${API}/Operadores`, { params }).pipe(
      map(items => items.map(r => this.mapOperador(r))),
      catchError(() => of(OPERADORES))   // fallback a mock si la API no está disponible
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

  crearOperador(data: CrearOperadorRequest): Observable<CrearUsuarioResult> {
    return this.http.post<CrearUsuarioResult>(`${API}/Operadores`, data);
  }

  actualizarEstadoOperador(idOperador: number, nuevoEstado: 'ACTIVO' | 'INACTIVO'): Observable<CrearUsuarioResult> {
    return this.http.patch<CrearUsuarioResult>(`${API}/Operadores/${idOperador}/estado`, { nuevoEstado });
  }

  editarOperador(idOperador: number, data: EditarOperadorRequest): Observable<CrearUsuarioResult> {
    return this.http.put<CrearUsuarioResult>(`${API}/Operadores/${idOperador}`, data);
  }

  getServiciosOperador(idOperador: number): Observable<ServicioProximo[]> {
    return this.http
      .get<ProxServApiItem[]>(`${API}/Operadores/${idOperador}/proximos-servicios`)
      .pipe(
        map(items => items.map(r => ({
          id:      `SRV-${String(r.id).padStart(3, '0')}`,
          fecha:   r.fechaAbreviada,
          hora:    r.horaInicio,
          cliente: r.nomCliente,
        }))),
        catchError(() => of([]))
      );
  }

  private mapOperador(r: OperadorApiItem): Operador {
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    let proximoServicio: Operador['proximoServicio'] = null;
    if (r.proximaFechaServicio) {
      const d = new Date(r.proximaFechaServicio);
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
        id:        h.id,
        estado:    h.activo ? 'ACTIVO' : 'INACTIVO',
        horaInicio: h.abre,
        horaFinal:  h.cierra,
      })),
    };
    return this.http.put<{ exitoso: number; mensaje: string }>(`${API}/agenda/horarios`, body);
  }

  crearUsuario(data: CrearUsuarioRequest): Observable<CrearUsuarioResult> {
    return this.http.post<CrearUsuarioResult>(`${API}/usuarios`, data);
  }

  editarUsuario(idUsuario: number, data: EditarUsuarioRequest): Observable<CrearUsuarioResult> {
    return this.http.put<CrearUsuarioResult>(`${API}/usuarios/${idUsuario}`, data);
  }

  getUsuarios(): Observable<UsuarioAdmin[]> {
    return this.http.get<UsuarioApiItem[]>(`${API}/usuarios`).pipe(
      map(items => items.map(i => this.mapUsuario(i)))
    );
  }

  private mapUsuario(item: UsuarioApiItem): UsuarioAdmin {
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const d = new Date(item.fechaCreacion);
    return {
      id:            `USR-${String(item.id).padStart(3, '0')}`,
      nombres:       item.nombres,
      apellidos:     item.apellidos,
      correo:        item.correo,
      telefono:      item.telefono ?? '',
      rol:           item.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Staff',
      fechaCreacion: `${d.getUTCDate()} ${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
      activo:        item.estado === 'ACTIVO',
    };
  }

  getTarifarioGlobal(): Observable<TarifaGlobal | null> {
    return this.http.get<TarifaGlobal | null>(`${API}/configuracion/tarifario-global`);
  }

  actualizarTarifarioGlobal(id: number, tarifaBase: number, tarifaKm: number): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.put<{ exitoso: number; mensaje: string }>(`${API}/configuracion/tarifario-global`, { id, tarifaBase, tarifaKm });
  }

  // TODO: reemplazar con this.http.get('/api/admin/configuracion/tarifas')
  getTarifasCliente(): Observable<TarifaCliente[]> {
    return of(TARIFAS_CLIENTES).pipe(delay(200));
  }

  getParametrosOperativos(): Observable<ParametrosOperativos> {
    return this.http.get<ParametrosOperativos>(`${API}/configuracion/parametro-operativo`);
  }

  actualizarParametroOperativo(dto: ParametrosOperativos): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.put<{ exitoso: number; mensaje: string }>(`${API}/configuracion/parametro-operativo`, dto);
  }

  getParametroOperativo(): Observable<{ tiempoCorte: number }> {
    return this.http.get<{ tiempoCorte: number }>(`${API}/configuracion/parametro-operativo`);
  }

  getReportes(): Observable<ServicioReporte[]> {
    return this.http.get<any[]>(`${API}/reportes`).pipe(
      map(data => data.map(r => this.mapReporte(r)))
    );
  }

  updEstadoAdministrativo(idReserva: number, estado: EstadoAdminServicio): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.put<{ exitoso: number; mensaje: string }>(
      `${API}/reportes/${idReserva}/estado-administrativo`,
      { estadoAdministrativo: estado.toUpperCase() }
    );
  }

  private mapReporte(r: any): ServicioReporte {
    return {
      id:                   r.id,
      cliente:              r.cliente,
      costo:                r.costo,
      origen:               r.origen,
      destino:              r.destino,
      distanciaKm:          r.distanciaKm,
      fecha:                r.fecha,
      hora:                 r.hora,
      tiempoMin:            r.tiempoMin,
      bloques:              r.bloques,
      carga:                String(r.cantidadCarga ?? 0),
      vehiculos:            0,
      operador:             r.operador ?? null,
      unidad:               r.unidad ?? null,
      estado:               this.mapEstadoOper(r.estado),
      estadoAdministrativo: this.mapEstadoAdmin(r.estadoAdministrativo),
      fechaCompleta:        r.fechaCompleta,
      fechaCorta:           r.fechaCorta,
      grua:                 r.grua,
      motivoCancelacion:    r.motivoCancelacion ?? null,
      canceladoPor:         r.canceladoPor ?? null,
    };
  }

  private mapEstadoOper(e: string): EstadoServicioAdmin {
    const tabla: Record<string, EstadoServicioAdmin> = {
      RESERVADO:  'Reservado',
      ASIGNADO:   'Asignado',
      ENCURSO:    'En Curso',
      FINALIZADO: 'Finalizado',
      CANCELADO:  'Cancelado',
    };
    return tabla[e?.toUpperCase()] ?? 'Finalizado';
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

const CLIENTES_B2B: ClienteB2B[] = [
  {
    id: 'CLI-001', empresa: 'Transportes XYZ S.A.', contacto: 'Juan Pérez',
    correo: 'juan@txyz.com', telefono: '+54 11 1234-5678',
    loginId: 'TXYZ', password: 'temp123',
    tarifaBase: 150, tarifaKm: 45, tipoTarifaBase: 'CUSTOM', tipoTarifaKm: 'CUSTOM', activo: true,
  },
  {
    id: 'CLI-002', empresa: 'Logística Beta Ltda.', contacto: 'María González',
    correo: 'mgonzalez@logbeta.com', telefono: '+54 11 2345-6789',
    loginId: 'LBETA', password: 'pass456',
    tarifaBase: 0, tarifaKm: 40, tipoTarifaBase: 'GLOBAL', tipoTarifaKm: 'CUSTOM', activo: true,
  },
  {
    id: 'CLI-003', empresa: 'Mudanzas Express Corp.', contacto: 'Carlos Rodríguez',
    correo: 'carlos@mudex.com', telefono: '+54 11 3456-7890',
    loginId: 'MUDEX', password: 'mudex789',
    tarifaBase: 140, tarifaKm: 40, tipoTarifaBase: 'CUSTOM', tipoTarifaKm: 'CUSTOM', activo: false,
  },
  {
    id: 'CLI-004', empresa: 'Distribuidora Central', contacto: 'Ana López',
    correo: 'ana@distcentral.com', telefono: '+54 11 4567-8901',
    loginId: 'DCENTRAL', password: 'central321',
    tarifaBase: 160, tarifaKm: 50, tipoTarifaBase: 'CUSTOM', tipoTarifaKm: 'CUSTOM', activo: true,
  },
];

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

const DIAS_SEMANA_LAB: DiaSemana[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const HORAS_COMPLETO: HoraGrid[]   = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const HORAS_MANANA:  HoraGrid[]    = ['08:00','09:00','10:00','11:00','12:00'];
const HORAS_TARDE:   HoraGrid[]    = ['13:00','14:00','15:00','16:00','17:00'];

interface CrearClienteRequest {
  alias:          string;
  contrasena:     string;
  empresa:        string;
  nomContacto:    string;
  nroContacto?:   string;
  correoContacto: string;
  tarifaBase:     number;
  tarifaKm:       number;
}

interface EditarClienteRequest {
  contrasena?:    string;
  empresa:        string;
  nomContacto:    string;
  nroContacto?:   string;
  correoContacto: string;
  tarifaBase:     number;
  tarifaKm:       number;
}

interface CrearUsuarioRequest {
  correo:     string;
  contrasena: string;
  nombres:    string;
  apellidos:  string;
  telefono?:  string;
  rol:        'ADMINISTRADOR' | 'STAFF';
}

interface EditarUsuarioRequest {
  contrasena?: string;
  nombres:     string;
  apellidos:   string;
  telefono?:   string;
  correo:      string;
  rol:         'ADMINISTRADOR' | 'STAFF';
}

interface ClienteApiItem {
  id:              number;
  empresa:         string;
  nomContacto:     string;
  nroContacto:     string | null;
  correoContacto:  string;
  tarifaBase:      number;
  tarifaKm:        number;
  tipoTarifaBase:  string;
  tipoTarifaKm:    string;
  estado:          string;
  alias:           string;
  contraseña:      string | null;
}

interface IngresoTallerRequest {
  nombreResponsable: string;
  kilometraje:       number;
  nota?:             string;
}

interface RetornoOperativaRequest {
  nombreResponsable: string;
  kilometraje:       number;
  nota?:             string;
}

interface BitaMantApiItem {
  titulo:          string;
  fechaCreacion:   string;
  responsable:     string;
  kilometraje:     number;
  nota:            string | null;
  estadoOperacion: string;
}

interface GruaApiItem {
  id:              number;
  placa:           string;
  marca:           string;
  modelo:          string;
  añoFabricacion:  number;
  capacidad:       number;
  fecVenSeg:       string | null;
  estadoOperacion: string;
  estado:          string;
}

interface OperadorApiItem {
  id:                      number;
  alias:                   string;
  nombresCompleto:         string;
  nombres:                 string;
  apellidos:               string;
  correo:                  string;
  telefono:                string | null;
  nroLicencia:             string;
  fecVenLic:               string;
  estado:                  string;
  proximaFechaServicio:    string | null;
  proximaHoraServicio:     string | null;
  totalServiciosAsignados: number;
  totalHorasSemanales:     number;
}

interface ProxServApiItem {
  id:             number;
  fechaServicio:  string;
  horaInicio:     string;
  horaFin:        string;
  nomCliente:     string;
  fechaAbreviada: string;
}

interface UsuarioApiItem {
  id:            number;
  nombres:       string;
  apellidos:     string;
  correo:        string;
  telefono:      string | null;
  rol:           string;
  estado:        string;
  fechaCreacion: string;
}

interface HorarioApiItem {
  id:         number;
  nroDia:     number;
  nombreDia:  string;
  estado:     string;
  horaInicio: string;
  horaFinal:  string;
}

interface CrearUpdExcepcionDto {
  id:                number;
  fecha:             string;
  motivo:            string;
  horaInicio:        string;
  horaFin:           string;
  descripcionMotivo: string;
}

interface AgendaExcepcionResult {
  exitoso: number;
  mensaje: string;
  idNuevo: number;
}

const OPERADORES: Operador[] = [
  {
    id: 'OP-001',
    nombre: 'Roberto Sánchez',
    nombres: 'Roberto',
    apellidos: 'Sánchez',
    correo: 'roberto.sanchez@romo.com',
    telefono: '+54 11 2222-3333',
    loginId: 'OPER001',
    password: 'driver123',
    licencia: 'D-12345678',
    vencimientoLicencia: '2025-06-14',
    proximoServicio: { fecha: '03 mar', hora: '14:00' },
    serviciosAsignados: [
      { id: 'SRV-001', fecha: '03 mar', hora: '14:00', cliente: 'Transportes XYZ S.A.' },
      { id: 'SRV-002', fecha: '04 mar', hora: '09:00', cliente: 'Logística ABC Ltda.' },
      { id: 'SRV-003', fecha: '05 mar', hora: '16:00', cliente: 'Distribuidora Central' },
      { id: 'SRV-004', fecha: '07 mar', hora: '10:00', cliente: 'Mudanzas Express Corp.' },
    ],
    tipoDisponibilidad: 'Tiempo Completo',
    disponibilidad: buildGrid(DIAS_SEMANA_LAB, HORAS_COMPLETO),
    activo: true,
  },
  {
    id: 'OP-002',
    nombre: 'Fernando López',
    nombres: 'Fernando',
    apellidos: 'López',
    correo: 'fernando.lopez@romo.com',
    telefono: '+54 11 3333-4444',
    loginId: 'OPER002',
    password: 'driver456',
    licencia: 'D-87654321',
    vencimientoLicencia: '2025-08-19',
    proximoServicio: { fecha: '04 mar', hora: '11:00' },
    serviciosAsignados: [
      { id: 'SRV-005', fecha: '04 mar', hora: '11:00', cliente: 'Logística Beta Ltda.' },
      { id: 'SRV-006', fecha: '06 mar', hora: '09:00', cliente: 'Transportes XYZ S.A.' },
    ],
    tipoDisponibilidad: 'Horario Parcial',
    disponibilidad: buildGrid(DIAS_SEMANA_LAB, HORAS_MANANA),
    activo: true,
  },
  {
    id: 'OP-003',
    nombre: 'Martín Gómez',
    nombres: 'Martín',
    apellidos: 'Gómez',
    correo: 'martin.gomez@romo.com',
    telefono: '+54 11 4444-5555',
    loginId: 'OPER003',
    password: 'driver789',
    licencia: 'D-11223344',
    vencimientoLicencia: '2024-02-09',
    proximoServicio: null,
    serviciosAsignados: [],
    tipoDisponibilidad: 'Personalizado',
    disponibilidad: buildGrid(['Lun', 'Mié', 'Vie'], HORAS_TARDE),
    activo: true,
  },
  {
    id: 'OP-004',
    nombre: 'Carlos Morales',
    nombres: 'Carlos',
    apellidos: 'Morales',
    correo: 'carlos.morales@romo.com',
    telefono: '+54 11 5555-6666',
    loginId: 'OPER004',
    password: 'driver000',
    licencia: 'D-99887766',
    vencimientoLicencia: '2025-01-14',
    proximoServicio: null,
    serviciosAsignados: [],
    tipoDisponibilidad: 'Horario Parcial',
    disponibilidad: buildGrid(DIAS_SEMANA_LAB, HORAS_MANANA),
    activo: false,
  },
];



const SERVICIOS_ADMIN: ServicioAdmin[] = [
  {
    id: 'SRV-001',
    cliente: 'Transportes XYZ S.A.',
    costo: 562.5,
    origen: 'Av. Corrientes 1234, CABA',
    destino: 'Av. Libertador 5678, Vicente López',
    distanciaKm: 12.5,
    fecha: '4/2/2024',
    hora: '10:00',
    tiempoMin: 80,
    bloques: 2,
    carga: 'Estándar',
    vehiculos: 1,
    operador: null,
    unidad: null,
    estado: 'Reservado',
  },
  {
    id: 'SRV-002',
    cliente: 'Logística Beta Ltda.',
    costo: 420.0,
    origen: 'Av. Santa Fe 2000, CABA',
    destino: 'Av. Maipú 300, Olivos',
    distanciaKm: 8.3,
    fecha: '4/2/2024',
    hora: '11:00',
    tiempoMin: 60,
    bloques: 2,
    carga: 'Estándar',
    vehiculos: 1,
    operador: 'Roberto Sánchez',
    unidad: 'GRU-001',
    estado: 'Asignado',
  },
  {
    id: 'SRV-003',
    cliente: 'Distribuidora Central',
    costo: 890.0,
    origen: 'Av. Cabildo 500, CABA',
    destino: 'Ruta 8 km 40, Pilar',
    distanciaKm: 25.0,
    fecha: '4/2/2024',
    hora: '09:00',
    tiempoMin: 120,
    bloques: 3,
    carga: 'Múltiple',
    vehiculos: 2,
    operador: 'Fernando López',
    unidad: 'GRU-002',
    estado: 'En Curso',
  },
];


const HORARIOS_REGULARES: HorarioRegular[] = [
  { id: 1, dia: 'Lunes',     abre: '07:00', cierra: '20:00', activo: true  },
  { id: 2, dia: 'Martes',    abre: '07:00', cierra: '20:00', activo: true  },
  { id: 3, dia: 'Miércoles', abre: '07:00', cierra: '20:00', activo: true  },
  { id: 4, dia: 'Jueves',    abre: '07:00', cierra: '20:00', activo: true  },
  { id: 5, dia: 'Viernes',   abre: '07:00', cierra: '20:00', activo: true  },
  { id: 6, dia: 'Sábado',    abre: '08:00', cierra: '14:00', activo: true  },
  { id: 7, dia: 'Domingo',   abre: '00:00', cierra: '00:00', activo: false },
];

const USUARIOS_ADMIN: UsuarioAdmin[] = [
  { id: 'USR-001', nombres: 'Carlos',  apellidos: 'Administrador', correo: 'admin@cranemanager.com',              telefono: '+51 999 000 001', rol: 'Administrador', fechaCreacion: '14 ene 2024', activo: true },
  { id: 'USR-002', nombres: 'María',   apellidos: 'González',      correo: 'maria.gonzalez@cranemanager.com',    telefono: '+51 999 000 002', rol: 'Staff',          fechaCreacion: '9 feb 2024',  activo: true },
  { id: 'USR-003', nombres: 'Juan',    apellidos: 'Pérez',         correo: 'juan.perez@cranemanager.com',        telefono: '+51 999 000 003', rol: 'Staff',          fechaCreacion: '4 mar 2024',  activo: true },
  { id: 'USR-004', nombres: 'Laura',   apellidos: 'Martínez',      correo: 'laura.martinez@cranemanager.com',    telefono: '+51 999 000 004', rol: 'Staff',          fechaCreacion: '10 abr 2024', activo: false },
];

const TARIFAS_CLIENTES: TarifaCliente[] = [
  { clienteId: 'CLI-001', tarifaBase: 120, tarifaKm: 45, vigenciaDesde: '31/12/2023', vigenciaHasta: '30/12/2024' },
  { clienteId: 'CLI-002', tarifaBase: 150, tarifaKm: 50, vigenciaDesde: '31/12/2023', vigenciaHasta: '30/12/2024' },
  { clienteId: 'CLI-003', tarifaBase: 100, tarifaKm: 42, vigenciaDesde: '31/12/2023', vigenciaHasta: null },
];

const SERVICIOS_REPORTE: ServicioReporte[] = [
  { id: 1, cliente: 'Transportes XYZ S.A.', costo: 1250, origen: 'CABA', destino: 'Vicente López', distanciaKm: 12.5, fecha: '15/2/2024', hora: '09:30', tiempoMin: 80, bloques: 2, carga: 'Estándar', vehiculos: 1, operador: 'Roberto Sánchez', unidad: 'ABC-123', estado: 'Finalizado', estadoAdministrativo: 'Pagado', fechaCompleta: '15 feb 2024, 09:30', fechaCorta: '15/02/2024', grua: 'ABC-123 (Cap. 2)' },
  { id: 2, cliente: 'Logística ABC Ltda.', costo: 2800, origen: 'CABA', destino: 'Olivos', distanciaKm: 8.3, fecha: '15/2/2024', hora: '14:00', tiempoMin: 60, bloques: 2, carga: 'Estándar', vehiculos: 1, operador: 'Fernando López', unidad: 'DEF-456', estado: 'Finalizado', estadoAdministrativo: 'Facturado', fechaCompleta: '15 feb 2024, 14:00', fechaCorta: '15/02/2024', grua: 'DEF-456 (Cap. 3)' },
  { id: 3, cliente: 'Express Cargo S.R.L.', costo: 950, origen: 'CABA', destino: 'Pilar', distanciaKm: 25, fecha: '14/2/2024', hora: '11:15', tiempoMin: 120, bloques: 3, carga: 'Múltiple', vehiculos: 2, operador: null, unidad: null, estado: 'Finalizado', estadoAdministrativo: 'Pendiente', fechaCompleta: '14 feb 2024, 11:15', fechaCorta: '14/02/2024', grua: 'GHI-789 (Cap. 5)' },
  { id: 4, cliente: 'Distribuidora Sur S.A.', costo: 3200, origen: 'CABA', destino: 'La Plata', distanciaKm: 30, fecha: '14/2/2024', hora: '10:45', tiempoMin: 140, bloques: 3, carga: 'Múltiple', vehiculos: 2, operador: 'Roberto Sánchez', unidad: 'JKL-012', estado: 'Finalizado', estadoAdministrativo: 'Pagado', fechaCompleta: '14 feb 2024, 10:45', fechaCorta: '14/02/2024', grua: 'JKL-012 (Cap. 2)' },
  { id: 5, cliente: 'Transportes XYZ S.A.', costo: 1100, origen: 'Palermo', destino: 'San Isidro', distanciaKm: 9.5, fecha: '13/2/2024', hora: '10:00', tiempoMin: 65, bloques: 2, carga: 'Estándar', vehiculos: 1, operador: 'Martín Gómez', unidad: 'MNO-345', estado: 'Finalizado', estadoAdministrativo: 'Pendiente', fechaCompleta: '13 feb 2024, 10:00', fechaCorta: '13/02/2024', grua: 'MNO-345 (Cap. 3)' },
  { id: 6, cliente: 'Logística ABC Ltda.', costo: 2200, origen: 'Belgrano', destino: 'Tigre', distanciaKm: 18, fecha: '12/2/2024', hora: '08:00', tiempoMin: 95, bloques: 2, carga: 'Estándar', vehiculos: 1, operador: 'Fernando López', unidad: 'PQR-678', estado: 'Cancelado', estadoAdministrativo: 'Pendiente', fechaCompleta: '12 feb 2024, 08:00', fechaCorta: '12/02/2024', grua: '—' },
  { id: 7, cliente: 'Express Cargo S.R.L.', costo: 1800, origen: 'Flores', destino: 'Quilmes', distanciaKm: 14, fecha: '11/2/2024', hora: '13:30', tiempoMin: 75, bloques: 2, carga: 'Estándar', vehiculos: 1, operador: null, unidad: null, estado: 'Cancelado', estadoAdministrativo: 'Pendiente', fechaCompleta: '11 feb 2024, 13:30', fechaCorta: '11/02/2024', grua: '—' },
];
