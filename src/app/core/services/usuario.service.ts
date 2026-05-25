import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CrearUsuarioRequest, CrearUsuarioResult, EditarUsuarioRequest, GetUsuariosParams, UsuarioAdmin, UsuarioPagedApiResponse } from '../../models/usuario.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;



@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);

  getUsuarios(params: GetUsuariosParams = {}): Observable<UsuarioPagedApiResponse> {
    const p: Record<string, string> = {};
    if (params.estado != null) p['estado'] = params.estado;
    if (params.id     != null) p['id']     = String(params.id);
    if (params.nombre != null) p['nombre'] = params.nombre;
    if (params.correo != null) p['correo'] = params.correo;
    if (params.rol    != null) p['rol']    = params.rol;
    if (params.pagina != null) p['pagina'] = String(params.pagina);
    if (params.tamano != null) p['tamano'] = String(params.tamano);

    return this.http.get<UsuarioPagedApiResponse | null>(`${API}/usuarios`, { params: p }).pipe(
      map(res => res ?? { total: 0, totalAdministradores: 0, totalStaff: 0, datos: [] })
    );

  }

  crearUsuario(data: CrearUsuarioRequest): Observable<CrearUsuarioResult> {
    return this.http.post<CrearUsuarioResult>(`${API}/usuarios`, data);
  }

  editarUsuario(idUsuario: number, data: EditarUsuarioRequest): Observable<CrearUsuarioResult> {
    return this.http.put<CrearUsuarioResult>(`${API}/usuarios/${idUsuario}`, data);
  }

  actualizarEstadoUsuario(idUsuario: number, nuevoEstado: 'ACTIVO' | 'INACTIVO'): Observable<CrearUsuarioResult> {
    return this.http.patch<CrearUsuarioResult>(`${API}/usuarios/${idUsuario}/estado`, { nuevoEstado });
  }
}

