import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { ClienteB2B, CrearClienteRequest, EditarClienteRequest, TarifaCliente } from '../../models/clientes.model';
import { CrearUsuarioResult } from '../../models/usuario.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly http = inject(HttpClient);

  getClientes(): Observable<ClienteB2B[]> {
    return this.http.get<ClienteB2B[]>(`${API}/clientes`).pipe(
      map(data => data ?? [])
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
