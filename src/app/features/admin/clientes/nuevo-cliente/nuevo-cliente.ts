import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Users, X, RefreshCw, AlertTriangle } from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';

@Component({
  selector: 'app-nuevo-cliente',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent],
  templateUrl: './nuevo-cliente.html',
})
export class NuevoClienteComponent {
  private readonly adminSvc = inject(AdminService);

  readonly guardar = output<void>();
  readonly cerrar  = output<void>();

  protected readonly UsersIcon         = Users;
  protected readonly XIcon             = X;
  protected readonly RefreshCwIcon     = RefreshCw;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly empresa    = signal('');
  protected readonly contacto   = signal('');
  protected readonly correo     = signal('');
  protected readonly telefono   = signal('');
  protected readonly loginId    = signal('');
  protected readonly password   = signal('');
  protected readonly tarifaBase = signal(0);
  protected readonly tarifaKm   = signal(0);

  protected readonly guardando  = signal(false);
  protected readonly errorMsg   = signal('');
  protected readonly showExito  = signal(false);
  protected readonly idNuevo    = signal(0);

  protected get idNuevoFormato(): string {
    return `CLI-${String(this.idNuevo()).padStart(3, '0')}`;
  }

  protected get esValido(): boolean {
    return !!this.empresa() && !!this.contacto() && !!this.correo() && !!this.loginId() && !!this.password();
  }

  protected generarPassword(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.password.set(pwd);
  }

  protected onGuardar(): void {
    if (!this.esValido || this.guardando()) return;

    this.errorMsg.set('');
    this.guardando.set(true);

    this.adminSvc.crearCliente({
      alias:          this.loginId(),
      contrasena:     this.password(),
      empresa:        this.empresa(),
      nomContacto:    this.contacto(),
      nroContacto:    this.telefono() || undefined,
      correoContacto: this.correo(),
      tarifaBase:     this.tarifaBase(),
      tarifaKm:       this.tarifaKm(),
    }).subscribe({
      next: result => {
        this.guardando.set(false);
        if (result.exitoso === 1) {
          this.idNuevo.set(result.idNuevo ?? 0);
          this.showExito.set(true);
        } else {
          this.errorMsg.set(result.mensaje || 'Error al crear el cliente.');
        }
      },
      error: err => {
        this.guardando.set(false);
        this.errorMsg.set(err?.error?.mensaje ?? 'Error al crear el cliente.');
      },
    });
  }
}
