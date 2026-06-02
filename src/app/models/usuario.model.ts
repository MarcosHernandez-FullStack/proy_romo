export type RolUsuario = 'ADMINISTRADOR' | 'STAFF';

export interface UsuarioAdmin {
  id:                  number;
  nombres:             string;
  apellidos:           string;
  correo:              string;
  telefono:            string;
  rol:                 RolUsuario;
  estado:              string;
  fechaCreacion:       string;
  fechaCreacionFormat: string;
}

export interface CrearUsuarioResult {
  exitoso: number;
  mensaje: string;
  idNuevo: number;
}

export interface CrearUsuarioRequest {
  correo:     string;
  contrasena: string;
  nombres:    string;
  apellidos:  string;
  telefono?:  string;
  rol:        'ADMINISTRADOR' | 'STAFF';
}

export interface EditarUsuarioRequest {
  contrasena?: string;
  nombres:     string;
  apellidos:   string;
  telefono?:   string;
  correo:      string;
  rol:         'ADMINISTRADOR' | 'STAFF';
}

export interface GetUsuariosParams {
  estado?:  string;
  id?:      number;
  nombre?:  string;
  correo?:  string;
  rol?:     string;
  pagina?:  number;
  tamano?:  number;
}


export interface UsuarioPagedApiResponse {
  total:                number;
  totalAdministradores: number;
  totalStaff:           number;
  datos:                UsuarioAdmin[];
}

export interface ErroresUsuario {
  correo?:    string;
  contrasena?: string;
  nombres?:   string;
  apellidos?: string;
  telefono?:  string;
}