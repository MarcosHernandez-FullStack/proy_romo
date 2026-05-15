import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DetalleServicio, EstadoAdmin, EstadoOperativo, Servicio, TrazabilidadItem, VehiculoDetalle } from '../../models/servicio.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ServicioService {
  private readonly http    = inject(HttpClient);
  private readonly authSvc = inject(AuthService);

  getServicios(fechaInicio?: string, fechaFin?: string): Observable<Servicio[]> {
    const params: Record<string, string> = {};
    const idCliente = this.authSvc.session()?.idCliente;
    if (idCliente)    params['idCliente']           = String(idCliente);
    if (fechaInicio)  params['fechaServicioInicio']  = fechaInicio;
    if (fechaFin)     params['fechaServicioFin']     = fechaFin;

    return this.http.get<ReservaApiItem[]>(`${API}/operaciones`, { params }).pipe(
      map(data => (data ?? []).map(r => this.mapServicio(r)))
    );
  }

  getDetalle(id: string): Observable<DetalleServicio> {
    return this.http.get<ReservaApiItem[]>(`${API}/operaciones`, {
      params: { id },
    }).pipe(
      map(data => this.mapDetalle(data[0]))
    );
  }

  private mapServicio(r: ReservaApiItem): Servicio {
    const partes = r.fechaHoraFormateada?.split(' · ') ?? [];
    return {
      id:              String(r.id),
      fecha:           partes[0] ?? '',
      hora:            partes[1] ?? '',
      origen:          r.direccionOrigen,
      destino:         r.direccionDestino,
      vehiculos:       r.cantidadVehiculos,
      costo:           r.costo,
      estadoOperativo: this.mapEstadoOp(r.estadoOperacion),
      estadoAdmin:     this.mapEstadoAdmin(r.estadoAdministrativo),
    };
  }

  private mapDetalle(r: ReservaApiItem): DetalleServicio {
    return {
      ...this.mapServicio(r),
      operadorNombre:   r.operadorAsignado ?? '',
      operadorTelefono: '',
      unidadPlaca:      r.gruaAsignada?.split(' - ')[0] ?? '',
      horaInicio:       r.horaInicio?.substring(0, 5) ?? '',
      horaFin:          r.horaFin?.substring(0, 5)    ?? '',
      duracionHoras:    r.nroBloques,
      vehiculosDetalle: (r.vehiculos ?? []).map<VehiculoDetalle>(v => ({
        tipo:       v.tipo        ?? '',
        placa:      v.placa       ?? '',
        modelo:     v.modelo      ?? '',
        observacion: v.observacion ?? '',
      })),
      trazabilidad: this.buildTrazabilidad(r),
    };
  }

  private buildTrazabilidad(r: ReservaApiItem): TrazabilidadItem[] {
    const items: TrazabilidadItem[] = [];
    const estadoOp    = this.mapEstadoOp(r.estadoOperacion);
    const estadoAdmin = this.mapEstadoAdmin(r.estadoAdministrativo);

    const estadoLabel: Record<EstadoOperativo, string> = {
      'Reservado':  'Servicio Reservado',
      'Asignado':   'Servicio Asignado',
      'En Curso':   'Servicio En Curso',
      'Finalizado': 'Servicio Finalizado',
    };
    const estadoColor: Record<EstadoOperativo, 'green' | 'blue' | 'orange'> = {
      'Reservado':  'orange',
      'Asignado':   'blue',
      'En Curso':   'orange',
      'Finalizado': 'green',
    };

    items.push({
      estado:      estadoLabel[estadoOp],
      descripcion: estadoOp === 'Finalizado' ? 'Confirmado por el operador en campo' : `En estado ${estadoOp}`,
      fecha:       '',
      hora:        '',
      color:       estadoColor[estadoOp],
    });

    if (estadoAdmin === 'Facturado' || estadoAdmin === 'Pagado') {
      items.push({ estado: 'Facturación', descripcion: 'Registrada por administración', fecha: '', hora: '', color: 'blue' });
    }
    if (estadoAdmin === 'Pagado') {
      items.push({ estado: 'Pago Confirmado', descripcion: 'Validado por administración', fecha: '', hora: '', color: 'orange' });
    }

    return items;
  }

  private mapEstadoOp(e: string): EstadoOperativo {
    const tabla: Record<string, EstadoOperativo> = {
      RESERVADO:  'Reservado',
      ASIGNADO:   'Asignado',
      ENCURSO:    'En Curso',
      FINALIZADO: 'Finalizado',
    };
    return tabla[e?.toUpperCase()] ?? 'Reservado';
  }

  private mapEstadoAdmin(e: string): EstadoAdmin {
    const tabla: Record<string, EstadoAdmin> = {
      PENDIENTE: 'Pendiente',
      FACTURADO: 'Facturado',
      PAGADO:    'Pagado',
    };
    return tabla[e?.toUpperCase()] ?? 'Pendiente';
  }
}

interface ReservaApiItem {
  id:                   number;
  direccionOrigen:      string;
  direccionDestino:     string;
  cantidadCarga:        number;
  horaInicio:           string;
  horaFin:              string;
  nroBloques:           number;
  estadoOperacion:      string;
  estadoAdministrativo: string;
  nombreCliente?:       string | null;
  gruaAsignada?:        string | null;
  operadorAsignado?:    string | null;
  vehiculos?:           VehiculoApiItem[];
  fechaHoraFormateada:  string;
  cantidadVehiculos:    number;
  costo:                number;
}

interface VehiculoApiItem {
  placa?:       string | null;
  modelo?:      string | null;
  tipo?:        string | null;
  observacion?: string | null;
}
