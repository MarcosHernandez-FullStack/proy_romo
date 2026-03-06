import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, User, Lock } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly UserIcon = User;
  protected readonly LockIcon = Lock;

  protected clientId = signal('');
  protected password = signal('');
  protected rememberMe = signal(false);
  protected error = signal('');
  protected loading = signal(false);

  protected onSubmit(): void {
    this.error.set('');
    if (!this.clientId() || !this.password()) {
      this.error.set('Ingrese sus credenciales.');
      return;
    }
    this.loading.set(true);
    this.auth.login(this.clientId(), this.password()).subscribe({
      next: (res) => {
        if (res.rol !== 'CLIENTE') {
          this.auth.logout();
          this.loading.set(false);
          this.error.set('Acceso solo para clientes.');
          return;
        }
        this.router.navigate(['/reservas']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Credenciales incorrectas o usuario inactivo.');
      },
    });
  }
}
