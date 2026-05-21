export interface ClienteB2B {
  id:             string;
  empresa:        string;
  contacto:       string;
  correo:         string;
  telefono:       string;
  loginId:        string;
  password:       string;
  tarifaBase:     number;
  tarifaKm:       number;
  tipoTarifaBase: 'GLOBAL' | 'CUSTOM';
  tipoTarifaKm:   'GLOBAL' | 'CUSTOM';
  activo:         boolean;
}

export interface TarifaCliente {
  clienteId:     string;
  tarifaBase:    number;
  tarifaKm:      number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
}

export interface ClienteApiItem {
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

export interface CrearClienteRequest {
  alias:          string;
  contrasena:     string;
  empresa:        string;
  nomContacto:    string;
  nroContacto?:   string;
  correoContacto: string;
  tarifaBase:     number;
  tarifaKm:       number;
}

export interface EditarClienteRequest {
  contrasena?:    string;
  empresa:        string;
  nomContacto:    string;
  nroContacto?:   string;
  correoContacto: string;
  tarifaBase:     number;
  tarifaKm:       number;
}
