export interface ClientePagedDto {
  total:          number;
  totalActivos:   number;
  totalInactivos: number;
  datos:          ClienteB2B[];
}

export interface GetClientesParams {
  estado?:   string;
  id?:       number;
  empresa?:  string;
  contacto?: string;
  pagina?:   number;
  tamano?:   number;
}

export interface ClienteB2B {
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

export interface TarifaCliente {
  clienteId:     number;
  tarifaBase:    number;
  tarifaKm:      number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
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
