import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, User, Lock } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
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
    this.loading.set(true);

    const ok = this.auth.login(this.clientId(), this.password());
    this.loading.set(false);

    if (ok) {
      this.router.navigate(['/reservas']);
    } else {
      this.error.set('Credenciales incorrectas. Verifica tu ID de Cliente o Alias.');
    }
  }
}
