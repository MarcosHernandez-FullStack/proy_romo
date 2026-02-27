import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Users, X, RefreshCw } from 'lucide-angular';
import { ClienteB2B } from '../../../../models/admin.model';

@Component({
  selector: 'app-nuevo-cliente',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './nuevo-cliente.html',
})
export class NuevoClienteComponent {
  readonly guardar = output<Omit<ClienteB2B, 'id'>>();
  readonly cerrar = output<void>();

  protected readonly UsersIcon = Users;
  protected readonly XIcon = X;
  protected readonly RefreshCwIcon = RefreshCw;

  protected readonly empresa = signal('');
  protected readonly contacto = signal('');
  protected readonly correo = signal('');
  protected readonly telefono = signal('');
  protected readonly loginId = signal('');
  protected readonly password = signal('');
  protected readonly tarifaBase = signal(0);
  protected readonly tarifaKm = signal(0);

  protected get esValido(): boolean {
    return !!this.empresa() && !!this.contacto() && !!this.correo() && !!this.loginId() && !!this.password();
  }

  protected generarPassword(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.password.set(pwd);
  }

  protected onGuardar(): void {
    if (!this.esValido) return;
    this.guardar.emit({
      empresa: this.empresa(),
      contacto: this.contacto(),
      correo: this.correo(),
      telefono: this.telefono(),
      loginId: this.loginId(),
      password: this.password(),
      tarifaBase: this.tarifaBase(),
      tarifaKm: this.tarifaKm(),
      activo: true,
    });
  }
}
