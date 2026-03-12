import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  BitacoraEntry,
  ClienteB2B,
  ExcepcionAgenda,
  HorarioRegular,
  Operador,
  ParametrosOperativos,
  ServicioAdmin,
  ServicioReporte,
  TarifaCliente,
  UnidadFlota,
  UsuarioAdmin,
} from '../../models/admin.model';
import { LoginRequest, LoginResponse } from '../../models/auth.model';

const API = 'http://localhost:5016/api';
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
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  getHorariosDisponibles(fecha: Date, rol: string, capacidad: number): Observable<{ horaDisponible: string }[]> {
    const fechaStr = fecha.toISOString().split('T')[0];
    return this.http.get<{ horaDisponible: string }[]>(
      `${API}/reservas/horarios-disponibles`,
      { params: { fecha: fechaStr, rol, capacidad: capacidad.toString() } }
    );
  }

  // TODO: reemplazar con this.http.get('/api/admin/operaciones')
  getOperaciones(): Observable<ServicioAdmin[]> {
    return of(SERVICIOS_ADMIN).pipe(delay(300));
  }

  getClientes(): Observable<ClienteB2B[]> {
    return this.http.get<any[]>(`${API}/clientes`, { params: { estado: 'ACTIVO' } }).pipe(
      map(data => data.map(c => ({
        id:         String(c.id),
        empresa:    c.empresa,
        contacto:   c.nomContacto,
        correo:     c.correoContacto,
        telefono:   c.nroContacto,
        loginId:    c.alias,
        password:   '',
        tarifaBase: c.tarifaBase,
        tarifaKm:   c.tarifaKm,
        activo:     true,
      })))
    );
  }

  // TODO: reemplazar con this.http.get('/api/admin/operadores')
  getOperadores(): Observable<Operador[]> {
    return of(OPERADORES).pipe(delay(200));
  }

  // TODO: reemplazar con this.http.get('/api/admin/flota')
  getFlota(): Observable<UnidadFlota[]> {
    return of(FLOTA).pipe(delay(200));
  }

  // TODO: reemplazar con this.http.get('/api/admin/flota/:id/bitacora')
  getBitacora(_unidadId: string): Observable<BitacoraEntry[]> {
    return of(BITACORA_MOCK).pipe(delay(200));
  }

  // TODO: reemplazar con this.http.get('/api/admin/excepciones')
  getExcepciones(): Observable<ExcepcionAgenda[]> {
    return of(EXCEPCIONES).pipe(delay(200));
  }

  // TODO: reemplazar con this.http.get('/api/admin/horarios')
  getHorariosRegulares(): Observable<HorarioRegular[]> {
    return of(HORARIOS_REGULARES).pipe(delay(200));
  }

  // TODO: reemplazar con this.http.get('/api/admin/usuarios')
  getUsuarios(): Observable<UsuarioAdmin[]> {
    return of(USUARIOS_ADMIN).pipe(delay(200));
  }

  // TODO: reemplazar con this.http.get('/api/admin/configuracion/tarifas')
  getTarifasCliente(): Observable<TarifaCliente[]> {
    return of(TARIFAS_CLIENTES).pipe(delay(200));
  }

  // TODO: reemplazar con this.http.get('/api/admin/configuracion/parametros')
  getParametrosOperativos(): Observable<ParametrosOperativos> {
    return of(PARAMETROS_OPERATIVOS).pipe(delay(200));
  }

  // TODO: reemplazar con this.http.get('/api/admin/reportes')
  getReportes(): Observable<ServicioReporte[]> {
    return of(SERVICIOS_REPORTE).pipe(delay(300));
  }

}

const CLIENTES_B2B: ClienteB2B[] = [
  {
    id: 'CLI-001',
    empresa: 'Transportes XYZ S.A.',
    contacto: 'Juan Pérez',
    correo: 'juan@txyz.com',
    telefono: '+54 11 1234-5678',
    loginId: 'TXYZ',
    password: 'temp123',
    tarifaBase: 150,
    tarifaKm: 45,
    activo: true,
  },
  {
    id: 'CLI-002',
    empresa: 'Logística Beta Ltda.',
    contacto: 'María González',
    correo: 'mgonzalez@logbeta.com',
    telefono: '+54 11 2345-6789',
    loginId: 'LBETA',
    password: 'pass456',
    tarifaBase: 120,
    tarifaKm: 40,
    activo: true,
  },
  {
    id: 'CLI-003',
    empresa: 'Mudanzas Express Corp.',
    contacto: 'Carlos Rodríguez',
    correo: 'carlos@mudex.com',
    telefono: '+54 11 3456-7890',
    loginId: 'MUDEX',
    password: 'mudex789',
    tarifaBase: 140,
    tarifaKm: 40,
    activo: false,
  },
  {
    id: 'CLI-004',
    empresa: 'Distribuidora Central',
    contacto: 'Ana López',
    correo: 'ana@distcentral.com',
    telefono: '+54 11 4567-8901',
    loginId: 'DCENTRAL',
    password: 'central321',
    tarifaBase: 160,
    tarifaKm: 50,
    activo: true,
  },
];

const OPERADORES: Operador[] = [
  {
    id: 'OP-001',
    nombre: 'Roberto Sánchez',
    telefono: '+54 11 2222-3333',
    loginId: 'OPER001',
    password: 'driver123',
    licencia: 'D-12345678',
    vencimientoLicencia: '2027-06-15',
    proximoServicio: '18/02/2026',
    activo: true,
  },
  {
    id: 'OP-002',
    nombre: 'Fernando López',
    telefono: '+54 11 3333-4444',
    loginId: 'OPER002',
    password: 'driver456',
    licencia: 'D-87654321',
    vencimientoLicencia: '2026-09-30',
    proximoServicio: '18/02/2026',
    activo: true,
  },
  {
    id: 'OP-003',
    nombre: 'Martín Gómez',
    telefono: '+54 11 4444-5555',
    loginId: 'OPER003',
    password: 'driver789',
    licencia: 'D-11223344',
    vencimientoLicencia: '2025-12-01',
    proximoServicio: null,
    activo: true,
  },
  {
    id: 'OP-004',
    nombre: 'Carlos Morales',
    telefono: '+54 11 5555-6666',
    loginId: 'OPER004',
    password: 'driver000',
    licencia: 'D-99887766',
    vencimientoLicencia: '2026-01-14',
    proximoServicio: null,
    activo: false,
  },
];

const FLOTA: UnidadFlota[] = [
  {
    id: 'UNI-001',
    placa: 'ABC-123',
    marca: 'Ford',
    modelo: 'F-550 Super Duty',
    anio: 2022,
    capacidad: 1,
    vencimientoSeguro: '2026-06-25',
    estado: 'Operativa',
  },
  {
    id: 'UNI-002',
    placa: 'XYZ-456',
    marca: 'Chevrolet',
    modelo: 'Silverado 3500HD',
    anio: 2021,
    capacidad: 2,
    vencimientoSeguro: '2026-03-14',
    estado: 'Operativa',
  },
  {
    id: 'UNI-003',
    placa: 'DEF-789',
    marca: 'International',
    modelo: 'Durastar',
    anio: 2020,
    capacidad: 3,
    vencimientoSeguro: '2025-12-19',
    estado: 'En Taller',
  },
  {
    id: 'UNI-004',
    placa: 'GHI-321',
    marca: 'Mercedes-Benz',
    modelo: 'Actros 2646',
    anio: 2023,
    capacidad: 2,
    vencimientoSeguro: '2026-05-09',
    estado: 'Operativa',
  },
  {
    id: 'UNI-005',
    placa: 'JKL-654',
    marca: 'Volvo',
    modelo: 'FMX 420',
    anio: 2022,
    capacidad: 3,
    vencimientoSeguro: '2026-01-14',
    estado: 'Operativa',
  },
];

const BITACORA_MOCK: BitacoraEntry[] = [
  {
    tipo: 'Retorno a Operativa',
    fecha: 'dom. 9 nov 2025',
    responsable: 'Carlos Ruiz',
    kilometraje: 38200,
    nota: 'Mantenimiento preventivo 20,000 km completado',
  },
  {
    tipo: 'Ingreso a Taller',
    fecha: 'lun. 28 oct 2025',
    responsable: 'Carlos Ruiz',
    kilometraje: 37900,
    nota: 'Revisión periódica según plan de mantenimiento',
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

const EXCEPCIONES: ExcepcionAgenda[] = [
  {
    id: 'EXC-001',
    fecha: 'jueves, 14 de marzo de 2024',
    tipo: 'Festivo',
    alcance: 'Día Completo',
    motivo: 'Día Nacional',
  },
  {
    id: 'EXC-002',
    fecha: 'domingo, 24 de marzo de 2024',
    tipo: 'Mantenimiento',
    alcance: 'Rango de Horas',
    horaInicio: '09:00',
    horaFin: '12:00',
    motivo: 'Mantenimiento General de Flota',
  },
];

const HORARIOS_REGULARES: HorarioRegular[] = [
  { dia: 'Lunes', abre: '07:00', cierra: '20:00', activo: true },
  { dia: 'Martes', abre: '07:00', cierra: '20:00', activo: true },
  { dia: 'Miércoles', abre: '07:00', cierra: '20:00', activo: true },
  { dia: 'Jueves', abre: '07:00', cierra: '20:00', activo: true },
  { dia: 'Viernes', abre: '07:00', cierra: '20:00', activo: true },
  { dia: 'Sábado', abre: '08:00', cierra: '14:00', activo: true },
  { dia: 'Domingo', abre: '00:00', cierra: '00:00', activo: false },
];

const USUARIOS_ADMIN: UsuarioAdmin[] = [
  { id: 'USR-001', nombre: 'Carlos Administrador', correo: 'admin@cranemanager.com', rol: 'Administrador', fechaCreacion: '14 ene 2024', activo: true },
  { id: 'USR-002', nombre: 'María González', correo: 'maria.gonzalez@cranemanager.com', rol: 'Staff', fechaCreacion: '9 feb 2024', activo: true },
  { id: 'USR-003', nombre: 'Juan Pérez', correo: 'juan.perez@cranemanager.com', rol: 'Staff', fechaCreacion: '4 mar 2024', activo: true },
  { id: 'USR-004', nombre: 'Laura Martínez', correo: 'laura.martinez@cranemanager.com', rol: 'Staff', fechaCreacion: '10 abr 2024', activo: false },
];

const TARIFAS_CLIENTES: TarifaCliente[] = [
  { clienteId: 'CLI-001', tarifaBase: 120, tarifaKm: 45, vigenciaDesde: '31/12/2023', vigenciaHasta: '30/12/2024' },
  { clienteId: 'CLI-002', tarifaBase: 150, tarifaKm: 50, vigenciaDesde: '31/12/2023', vigenciaHasta: '30/12/2024' },
  { clienteId: 'CLI-003', tarifaBase: 100, tarifaKm: 42, vigenciaDesde: '31/12/2023', vigenciaHasta: null },
];

const PARAMETROS_OPERATIVOS: ParametrosOperativos = {
  umbralLargaDistanciaKm: 15,
  margenManiobraMin: 30,
  umbralToleranciaMin: 5,
  tiempoRetornoBaseMin: 20,
};

const SERVICIOS_REPORTE: ServicioReporte[] = [
  { id: 'SRV-001', cliente: 'Transportes XYZ S.A.', costo: 1250, origen: 'CABA', destino: 'Vicente López', distanciaKm: 12.5, fecha: '15/2/2024', hora: '09:30', tiempoMin: 80, bloques: 2, carga: 'Estándar', vehiculos: 1, operador: 'Roberto Sánchez', unidad: 'ABC-123', estado: 'Finalizado', estadoAdministrativo: 'Pagado', fechaCompleta: '15 feb 2024, 09:30', grua: 'ABC-123 (Cap. 2)' },
  { id: 'SRV-002', cliente: 'Logística ABC Ltda.', costo: 2800, origen: 'CABA', destino: 'Olivos', distanciaKm: 8.3, fecha: '15/2/2024', hora: '14:00', tiempoMin: 60, bloques: 2, carga: 'Estándar', vehiculos: 1, operador: 'Fernando López', unidad: 'DEF-456', estado: 'Finalizado', estadoAdministrativo: 'Facturado', fechaCompleta: '15 feb 2024, 14:00', grua: 'DEF-456 (Cap. 3)' },
  { id: 'SRV-003', cliente: 'Express Cargo S.R.L.', costo: 950, origen: 'CABA', destino: 'Pilar', distanciaKm: 25, fecha: '14/2/2024', hora: '11:15', tiempoMin: 120, bloques: 3, carga: 'Múltiple', vehiculos: 2, operador: null, unidad: null, estado: 'Finalizado', estadoAdministrativo: 'Pendiente', fechaCompleta: '14 feb 2024, 11:15', grua: 'GHI-789 (Cap. 5)' },
  { id: 'SRV-004', cliente: 'Distribuidora Sur S.A.', costo: 3200, origen: 'CABA', destino: 'La Plata', distanciaKm: 30, fecha: '14/2/2024', hora: '10:45', tiempoMin: 140, bloques: 3, carga: 'Múltiple', vehiculos: 2, operador: 'Roberto Sánchez', unidad: 'JKL-012', estado: 'Finalizado', estadoAdministrativo: 'Pagado', fechaCompleta: '14 feb 2024, 10:45', grua: 'JKL-012 (Cap. 2)' },
  { id: 'SRV-005', cliente: 'Transportes XYZ S.A.', costo: 1100, origen: 'Palermo', destino: 'San Isidro', distanciaKm: 9.5, fecha: '13/2/2024', hora: '10:00', tiempoMin: 65, bloques: 2, carga: 'Estándar', vehiculos: 1, operador: 'Martín Gómez', unidad: 'MNO-345', estado: 'Finalizado', estadoAdministrativo: 'Pendiente', fechaCompleta: '13 feb 2024, 10:00', grua: 'MNO-345 (Cap. 3)' },
  { id: 'SRV-006', cliente: 'Logística ABC Ltda.', costo: 2200, origen: 'Belgrano', destino: 'Tigre', distanciaKm: 18, fecha: '12/2/2024', hora: '08:00', tiempoMin: 95, bloques: 2, carga: 'Estándar', vehiculos: 1, operador: 'Fernando López', unidad: 'PQR-678', estado: 'Cancelado', estadoAdministrativo: 'Pendiente', fechaCompleta: '12 feb 2024, 08:00', grua: '—' },
  { id: 'SRV-007', cliente: 'Express Cargo S.R.L.', costo: 1800, origen: 'Flores', destino: 'Quilmes', distanciaKm: 14, fecha: '11/2/2024', hora: '13:30', tiempoMin: 75, bloques: 2, carga: 'Estándar', vehiculos: 1, operador: null, unidad: null, estado: 'Cancelado', estadoAdministrativo: 'Pendiente', fechaCompleta: '11 feb 2024, 13:30', grua: '—' },
];
