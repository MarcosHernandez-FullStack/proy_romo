import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ParametrosOperativos, TarifaGlobal } from '../../models/configuracion.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private readonly http = inject(HttpClient);

  readonly reservaClienteOn = signal(true);

  constructor() {
    this.http.get<{ reservaClienteOn: boolean }>(`${API}/configuracion/publica`)
      .subscribe({ next: res => this.reservaClienteOn.set(res.reservaClienteOn) });
  }

  actualizarReservaClienteOn(value: boolean): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.patch<{ exitoso: number; mensaje: string }>(
      `${API}/configuracion/reserva-cliente-on`,
      value
    ).pipe(tap(res => { if (res.exitoso === 1) this.reservaClienteOn.set(value); }));
  }

  getTarifarioGlobal(): Observable<TarifaGlobal | null> {
    return this.http.get<TarifaGlobal | null>(`${API}/configuracion/tarifario-global`);
  }

  actualizarTarifarioGlobal(id: number, tarifaBase: number, tarifaKm: number): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.put<{ exitoso: number; mensaje: string }>(`${API}/configuracion/tarifario-global`, { id, tarifaBase, tarifaKm });
  }

  getParametroOperativo(): Observable<ParametrosOperativos> {
    return this.http.get<ParametrosOperativos>(`${API}/configuracion/parametro-operativo`);
  }

  actualizarParametroOperativo(dto: ParametrosOperativos): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.put<{ exitoso: number; mensaje: string }>(`${API}/configuracion/parametro-operativo`, dto);
  }
}
