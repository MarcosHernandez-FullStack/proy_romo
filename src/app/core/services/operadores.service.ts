import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CrearOperadorRequest, DispOperador, DispRango, DispResult, EditarOperadorRequest, GetOperadoresParams, OperadorPagedDto, ServicioProximo } from '../../models/operadores.model';
import { CrearUsuarioResult } from '../../models/usuario.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

const EMPTY_PAGED: OperadorPagedDto = {
  total: 0, conServiciosHoy: 0, conServiciosAsignados: 0, licenciasVencidas: 0, datos: [],
};

@Injectable({ providedIn: 'root' })
export class OperadoresService {
  private readonly http = inject(HttpClient);

  getOperadores(params: GetOperadoresParams = {}): Observable<OperadorPagedDto> {
    const p: Record<string, string> = {};
    if (params.estado         != null) p['estado']          = params.estado;
    if (params.id             != null) p['id']              = String(params.id);
    if (params.nombreCompleto != null) p['nombreCompleto']  = params.nombreCompleto;
    if (params.nroLicencia    != null) p['nroLicencia']     = params.nroLicencia;
    if (params.pagina         != null) p['pagina']          = String(params.pagina);
    if (params.tamano         != null) p['tamano']          = String(params.tamano);
    return this.http.get<OperadorPagedDto | null>(`${API}/Operadores`, { params: p }).pipe(
      map(res => res ?? EMPTY_PAGED),
    );
  }

  crearOperador(data: CrearOperadorRequest): Observable<CrearUsuarioResult> {
    return this.http.post<CrearUsuarioResult>(`${API}/Operadores`, data);
  }

  editarOperador(idOperador: number, data: EditarOperadorRequest): Observable<CrearUsuarioResult> {
    return this.http.put<CrearUsuarioResult>(`${API}/Operadores/${idOperador}`, data);
  }

  actualizarEstadoOperador(idOperador: number, nuevoEstado: 'ACTIVO' | 'INACTIVO'): Observable<CrearUsuarioResult> {
    return this.http.patch<CrearUsuarioResult>(`${API}/Operadores/${idOperador}/estado`, { nuevoEstado });
  }

  getServiciosOperador(idOperador: number): Observable<ServicioProximo[]> {
    return this.http.get<ServicioProximo[]>(`${API}/Operadores/${idOperador}/proximos-servicios`);
  }

  getDispOperador(idOperador: number): Observable<DispOperador> {
    return this.http.get<DispOperador>(`${API}/Operadores/${idOperador}/disponibilidad`);
  }

  guardarDispOperador(idOperador: number, disponibilidad: DispRango[], confirmar: boolean): Observable<DispResult> {
    return this.http.post<DispResult>(
      `${API}/Operadores/${idOperador}/disponibilidad`,
      { disponibilidad, confirmar }
    );
  }
}
