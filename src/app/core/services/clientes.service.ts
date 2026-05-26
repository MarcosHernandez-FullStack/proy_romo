import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, delay } from 'rxjs';
import { ClientePagedDto, CrearClienteRequest, EditarClienteRequest, GetClientesParams, TarifaCliente } from '../../models/clientes.model';
import { CrearUsuarioResult } from '../../models/usuario.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly http = inject(HttpClient);

  getClientes(params: GetClientesParams = {}): Observable<ClientePagedDto> {
    const p: Record<string, string> = {};
    if (params.estado)         p['estado']   = params.estado;
    if (params.id != null)     p['id']       = String(params.id);
    if (params.empresa)        p['empresa']  = params.empresa;
    if (params.contacto)       p['contacto'] = params.contacto;
    if (params.pagina != null) p['pagina']   = String(params.pagina);
    if (params.tamano != null) p['tamano']   = String(params.tamano);
    return this.http.get<ClientePagedDto | null>(`${API}/clientes`, { params: p }).pipe(
      map(res => res ?? 
        {
          total: 0, datos: [], totalActivos: 0, totalInactivos: 0,
        }
      )
    );
  }

  crearCliente(data: CrearClienteRequest): Observable<CrearUsuarioResult> {
    return this.http.post<CrearUsuarioResult>(`${API}/clientes`, data);
  }

  editarCliente(idCliente: number, data: EditarClienteRequest): Observable<CrearUsuarioResult> {
    return this.http.put<CrearUsuarioResult>(`${API}/clientes/${idCliente}`, data);
  }

  getTarifasCliente(): Observable<TarifaCliente[]> {
    return of(TARIFAS_CLIENTES).pipe(delay(200));
  }
}

const TARIFAS_CLIENTES: TarifaCliente[] = [
  { clienteId: 1, tarifaBase: 120, tarifaKm: 45, vigenciaDesde: '31/12/2023', vigenciaHasta: '30/12/2024' },
  { clienteId: 2, tarifaBase: 150, tarifaKm: 50, vigenciaDesde: '31/12/2023', vigenciaHasta: '30/12/2024' },
  { clienteId: 3, tarifaBase: 100, tarifaKm: 42, vigenciaDesde: '31/12/2023', vigenciaHasta: null },
];
