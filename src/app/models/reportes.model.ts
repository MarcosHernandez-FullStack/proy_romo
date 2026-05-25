import { ServicioAdmin } from './operaciones.model';

export interface ServicioReporte extends ServicioAdmin {
  estadoAdministrativo: string;
  fechaCompleta:        string;
  fechaCorta:           string;
  grua:                 string;
  motivoCancelacion?:   string | null;
  canceladoPor?:        string | null;
}
