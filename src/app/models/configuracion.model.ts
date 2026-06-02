export interface TarifaGlobal {
  id:         number;
  tarifaBase: number;
  tarifaKm:   number;
  estado:     string;
}

export interface ParametrosOperativos {
  id:                   number;
  umbralLargaDistancia: number;
  tiempoMargenManiobra: number;
  tiempoTolerancia:     number;
  tiempoRetornoBase:    number;
  tiempoCorte:          number;
  timerAdministrativo:  number;
  timerCliente:         number;
  zonaHoraria:          string;
  minutosCerca:         number;
  minutosMedio:         number;
  coordLatMaps:         string;
  coordLonMaps:         string;
  metrosCercania:       number;
}

export interface ErroresParametros {
  zonaHoraria?:          string;
  tiempoCorte?:          string;
  timerAdministrativo?:  string;
  timerCliente?:         string;
  tiempoTolerancia?:     string;
  tiempoMargenManiobra?: string;
  tiempoRetornoBase?:    string;
  umbralLargaDistancia?: string;
  minutosCerca?:         string;
  minutosMedio?:         string;
  metrosCercania?:       string;
  coordLatMaps?:         string;
  coordLonMaps?:         string;
}

export interface ErroresTarifaGlobal {
  tarifaBaseGlobal?: string;
  tarifaKmGlobal?:   string;
}
