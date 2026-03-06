import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Shield, Mail, Lock, LogIn } from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login-admin.html',
})
export class LoginAdminComponent {
  private readonly adminSvc = inject(AdminService);
  private readonly router   = inject(Router);

  protected readonly ShieldIcon = Shield;
  protected readonly MailIcon = Mail;
  protected readonly LockIcon = Lock;
  protected readonly LogInIcon = LogIn;

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');
  protected readonly loading = signal(false);

  protected submit(): void {
    this.error.set('');
    if (!this.email() || !this.password()) {
      this.error.set('Ingrese sus credenciales.');
      return;
    }
    this.loading.set(true);
    this.adminSvc.loginAdmin(this.email(), this.password()).subscribe({
      next: (res) => {
        if (res.rol !== 'ADMINISTRADOR') {
          this.adminSvc.logoutAdmin();
          this.loading.set(false);
          this.error.set('Acceso solo para administradores.');
          return;
        }
        this.router.navigate(['/admin/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Credenciales incorrectas o usuario inactivo.');
      },
    });
  }
}
