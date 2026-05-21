export type RolUsuario = 'ADMINISTRADOR' | 'STAFF';

export interface UsuarioAdmin {
  id:            number;
  nombres:       string;
  apellidos:     string;
  correo:        string;
  telefono:      string;
  rol:           RolUsuario;
  fechaCreacion: string;
  activo:        string;
}

export interface CrearUsuarioResult {
  exitoso: number;
  mensaje: string;
  idNuevo: number;
}

export interface UsuarioApiItem {
  id:                  number;
  nombres:             string;
  apellidos:           string;
  correo:              string;
  telefono:            string;
  rol:                 string;
  estado:              string;
  fechaCreacion:       string;
  fechaCreacionFormat: string;
}

export interface UsuarioPagedApiResponse {
  total:                number;
  totalAdministradores: number;
  totalStaff:           number;
  datos:                UsuarioApiItem[];
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
