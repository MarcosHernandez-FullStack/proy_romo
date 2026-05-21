import { EstadoAdminServicio, ServicioAdmin } from './operaciones.model';

export interface ServicioReporte extends Omit<ServicioAdmin, 'id'> {
  id:                   number;
  estadoAdministrativo: EstadoAdminServicio;
  fechaCompleta:        string;
  fechaCorta:           string;
  grua:                 string;
  motivoCancelacion?:   string | null;
  canceladoPor?:        string | null;
}
