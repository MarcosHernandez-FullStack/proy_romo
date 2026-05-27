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
  readonly parametroId      = signal(0);

  constructor() {
    this.http.get<{ reservaClienteOn: boolean }>(`${API}/configuracion/publica`)
      .subscribe({ next: res => this.reservaClienteOn.set(res.reservaClienteOn) });
    this.getParametroOperativo()
      .subscribe({ next: p => this.parametroId.set(p.id) });
  }

  actualizarReservaClienteOn(value: boolean): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.patch<{ exitoso: number; mensaje: string }>(
      `${API}/configuracion/${this.parametroId()}/reserva-cliente-on`,
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
    return this.http.get<ParametrosOperativos>(`${API}/configuracion/parametro-operativo`)
      .pipe(tap(p => this.parametroId.set(p.id)));
  }

  actualizarParametroOperativo(dto: ParametrosOperativos): Observable<{ exitoso: number; mensaje: string }> {
    return this.http.put<{ exitoso: number; mensaje: string }>(`${API}/configuracion/${dto.id}/parametro-operativo`, dto);
  }
}
