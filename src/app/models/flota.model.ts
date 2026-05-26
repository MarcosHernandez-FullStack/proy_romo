export interface GruaPagedDto {
  total:           number;
  operativas:      number;
  enTaller:        number;
  segurosCriticos: number;
  datos:           UnidadFlota[];
}

export interface GetGruasParams {
  estado?:          string;
  estadoOperacion?: string;
  id?:              number;
  placa?:           string;
  marca?:           string;
  modelo?:          string;
  pagina?:          number;
  tamano?:          number;
}

export interface UnidadFlota {
  id:              number;
  placa:           string;
  marca:           string;
  modelo:          string;
  anioFabricacion: number;
  capacidad:       number;
  fecVenSeg:       string | null;
  estadoOperacion: string;
  estado:          string;
}

export interface GruaRequest {
  placa:          string;
  marca:          string;
  modelo:         string;
  anioFabricacion: number;
  capacidad:       number;
  fecVenSeg:       string;
}

export interface BitacoraEntry {
  titulo:          string;
  fechaCreacion:   string;
  responsable:     string;
  kilometraje:     number;
  nota:            string | null;
  estadoOperacion: string;
}

export interface DisponibilidadGrua {
  horaStr:                 string;
  capacidad:               number;
  cantidadReservas:        number;
  cantidadGruas:           number;
  cantidadGruasDisponible: number;
}

export interface IngresoTallerRequest {
  nombreResponsable: string;
  kilometraje:       number;
  nota?:             string;
}

export interface RetornoOperativaRequest {
  nombreResponsable: string;
  kilometraje:       number;
  nota?:             string;
}
