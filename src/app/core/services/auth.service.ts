import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface AuthUser {
  id: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly _user = signal<AuthUser | null>(this.loadUser());

  readonly user = this._user.asReadonly();

  login(id: string, password: string): boolean {
    // TODO: reemplazar con this.http.post('/api/auth/login', { id, password })
    const validIds = ['CLI-2024-001', 'empresa_demo'];
    if (validIds.includes(id) && password.length > 0) {
      const user: AuthUser = { id, email: 'usuario@empresa.com' };
      localStorage.setItem('crane_user', JSON.stringify(user));
      this._user.set(user);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('crane_user');
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this._user() !== null;
  }

  private loadUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem('crane_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
