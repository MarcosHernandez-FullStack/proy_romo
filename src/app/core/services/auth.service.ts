import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../../models/auth.model';

const API = 'http://localhost:5016/api';
const STORAGE_KEY = 'crane_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly _session = signal<LoginResponse | null>(this.loadSession());

  readonly session = this._session.asReadonly();

  login(alias: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { identificador: alias, contrasena: password };
    return this.http.post<LoginResponse>(`${API}/auth/login`, body).pipe(
      tap(res => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        this._session.set(res);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._session.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this._session() !== null;
  }

  getToken(): string | null {
    return this._session()?.token ?? null;
  }

  private loadSession(): LoginResponse | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
