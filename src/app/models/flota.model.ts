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
