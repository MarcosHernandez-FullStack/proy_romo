export interface TarifaGlobal {
  id:         number;
  tarifaBase: number;
  tarifaKm:   number;
  estado:     string;
}

export interface ParametrosOperativos {
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
