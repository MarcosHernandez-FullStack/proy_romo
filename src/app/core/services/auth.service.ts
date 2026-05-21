import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../../models/auth.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;
const STORAGE_KEY       = 'crane_user';
const ADMIN_STORAGE_KEY = 'crane_admin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _session      = signal<LoginResponse | null>(this.loadFromStorage(STORAGE_KEY));
  private readonly _adminSession = signal<LoginResponse | null>(this.loadFromStorage(ADMIN_STORAGE_KEY));

  readonly session      = this._session.asReadonly();
  readonly adminSession = this._adminSession.asReadonly();

  // ── Cliente ───────────────────────────────────────────────────────────────

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

  // ── Admin ─────────────────────────────────────────────────────────────────

  loginAdmin(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { identificador: email, contrasena: password };
    return this.http.post<LoginResponse>(`${API}/auth/login`, body).pipe(
      tap(res => {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(res));
        this._adminSession.set(res);
      })
    );
  }

  logoutAdmin(): void {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    this._adminSession.set(null);
    this.router.navigate(['/admin/login']);
  }

  isAdminLoggedIn(): boolean {
    return this._adminSession() !== null;
  }

  getAdminToken(): string | null {
    return this._adminSession()?.token ?? null;
  }

  // ── Shared ────────────────────────────────────────────────────────────────

  private loadFromStorage(key: string): LoginResponse | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      const session: LoginResponse = JSON.parse(stored);
      if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
        localStorage.removeItem(key);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }
}
