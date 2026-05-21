export type EstadoUnidad = 'Operativa' | 'En Taller' | 'Baja';

export interface UnidadFlota {
  id:                string;
  placa:             string;
  marca:             string;
  modelo:            string;
  anio:              number;
  capacidad:         number;
  vencimientoSeguro: string;
  estado:            EstadoUnidad;
}

export interface GruaRequest {
  placa:          string;
  marca:          string;
  modelo:         string;
  añoFabricacion: number;
  capacidad:      number;
  fecVenSeg:      string;
}

export interface BitacoraEntry {
  tipo:        string;
  fecha:       string;
  responsable: string;
  kilometraje: number;
  nota:        string;
}

export interface DisponibilidadGrua {
  horaStr:                 string;
  capacidad:               number;
  cantidadReservas:        number;
  cantidadGruas:           number;
  cantidadGruasDisponible: number;
}

export interface GruaApiItem {
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

export interface BitaMantApiItem {
  titulo:          string;
  fechaCreacion:   string;
  responsable:     string;
  kilometraje:     number;
  nota:            string | null;
  estadoOperacion: string;
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
