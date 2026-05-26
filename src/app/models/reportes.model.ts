import { ServicioAdmin } from './operaciones.model';

export interface ServicioReporte extends ServicioAdmin {
  estadoAdministrativo: string;
  fechaCompleta:        string;
  fechaCorta:           string;
  grua:                 string;
  motivoCancelacion?:   string | null;
  canceladoPor?:        string | null;
}

export interface ReportePagedDto {
  total:       number;
  finalizados: number;
  cancelados:  number;
  montoTotal:  number;
  pendientes:  number;
  facturados:  number;
  pagados:     number;
  datos:       ServicioReporte[];
}

export interface GetReportesParams {
  id?:                   number;
  idCliente?:            number;
  fechaDesde?:           string;
  fechaHasta?:           string;
  estadoOperacion?:      string;
  estadoAdministrativo?: string;
  placa?:                string;
  empresa?:              string;
  pagina?:               number;
  tamano?:               number;
}
