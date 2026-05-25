import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrearOperadorRequest, DispOperador, DispRango, DispResult, EditarOperadorRequest, Operador, ServicioProximo } from '../../models/operadores.model';
import { CrearUsuarioResult } from '../../models/usuario.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class OperadoresService {
  private readonly http = inject(HttpClient);

  getOperadores(estado?: string): Observable<Operador[]> {
    const params: Record<string, string> = {};
    if (estado) params['estado'] = estado;
    return this.http.get<Operador[]>(`${API}/Operadores`, { params });
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
