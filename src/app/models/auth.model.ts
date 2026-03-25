export interface LoginRequest {
  identificador: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  id: number;
  alias: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  rol: string;
  idCliente?:  number;
  tarifaKm?:   number;
  tarifaBase?: number;
  empresa?:    string;
}
