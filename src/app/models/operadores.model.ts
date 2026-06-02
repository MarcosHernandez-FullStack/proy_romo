import { GridDisponibilidad } from './agenda.model';

export type TipoDisponibilidad = 'Tiempo Completo' | 'Horario Parcial' | 'Personalizado';

export interface OperadorPagedDto {
  total:                 number;
  conServiciosHoy:       number;
  conServiciosAsignados: number;
  licenciasVencidas:     number;
  datos:                 Operador[];
}

export interface GetOperadoresParams {
  estado?:         string;
  id?:             number;
  nombreCompleto?: string;
  nroLicencia?:    string;
  pagina?:         number;
  tamano?:         number;
}

export interface ServicioProximo {
  id:             number;
  fechaServicio:  string;
  horaInicio:     string;
  horaFin:        string;
  nomCliente:     string;
  fechaAbreviada: string;
}

export interface Operador {
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

export interface EditarOperadorRequest {
  contrasena:  string;
  nombres:     string;
  apellidos:   string;
  telefono:    string;
  correo:      string;
  rol:         'OPERADOR';
  nroLicencia: string;
  fecVenLic:   string;
}

export interface CrearOperadorRequest {
  alias:       string;
  contrasena:  string;
  nombres:     string;
  apellidos:   string;
  telefono:    string;
  correo:      string;
  rol:         'OPERADOR';
  nroLicencia: string;
  fecVenLic:   string;
}

export interface DispSlot {
  id:         number;
  nroDia:     number;
  nombreDia:  string;
  horaInicio: string;
  horaFin:    string;
}

export interface DispOperador {
  slots:               DispSlot[];
  totalHorasSemanales: number;
  diasActivos:         number;
}

export interface DispRango {
  NroDia:     number;
  NombreDia:  string;
  HoraInicio: string;
  HoraFin:    string;
}

export interface DispResult {
  exitoso: number;
  mensaje: string;
}

export interface ErroresOperador {
  alias?:       string;
  contrasena?:  string;
  nombres?:     string;
  apellidos?:   string;
  telefono?:    string;
  correo?:      string;
  nroLicencia?: string;
  fecVenLic?:   string;
}
