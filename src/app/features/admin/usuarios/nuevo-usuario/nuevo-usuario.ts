import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserPlus, X, RefreshCw, AlertTriangle } from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';
import { RolUsuario } from '../../../../models/admin.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';

@Component({
  selector: 'app-nuevo-usuario',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent],
  templateUrl: './nuevo-usuario.html',
})
export class NuevoUsuarioComponent {
  private readonly adminSvc = inject(AdminService);

  readonly guardar = output<void>();
  readonly cerrar  = output<void>();

  protected readonly UserPlusIcon       = UserPlus;
  protected readonly XIcon             = X;
  protected readonly RefreshCwIcon     = RefreshCw;
  protected readonly AlertTriangleIcon = AlertTriangle;

  readonly roles: RolUsuario[] = ['Administrador', 'Staff'];

  protected readonly correo     = signal('');
  protected readonly contrasena = signal('');
  protected readonly nombres    = signal('');
  protected readonly apellidos  = signal('');
  protected readonly telefono   = signal('');
  protected readonly rol        = signal<RolUsuario>('Staff');

  protected readonly guardando      = signal(false);
  protected readonly errorMsg       = signal('');
  protected readonly showExito      = signal(false);
  protected readonly idNuevo        = signal(0);
  protected readonly mostrarErrores = signal(false);

  protected get idNuevoFormato(): string {
    return `USR-${String(this.idNuevo()).padStart(3, '0')}`;
  }

  // ── Validaciones ─────────────────────────────────────────
  protected get errorCorreo(): string {
    if (!this.correo().trim()) return 'El correo electrónico es obligatorio.';
    if (this.correo().length > 100) return 'Máximo 100 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo())) return 'Ingrese un correo válido.';
    return '';
  }

  protected get errorContrasena(): string {
    if (!this.contrasena().trim()) return 'La contraseña es obligatoria.';
    if (this.contrasena().length > 20) return 'Máximo 20 caracteres.';
    return '';
  }

  protected get errorNombres(): string {
    if (!this.nombres().trim()) return 'Los nombres son obligatorios.';
    if (this.nombres().length > 100) return 'Máximo 100 caracteres.';
    return '';
  }

  protected get errorApellidos(): string {
    if (!this.apellidos().trim()) return 'Los apellidos son obligatorios.';
    if (this.apellidos().length > 100) return 'Máximo 100 caracteres.';
    return '';
  }

  protected get errorTelefono(): string {
    if (!this.telefono().trim()) return 'El teléfono es obligatorio.';
    if (this.telefono().length > 50) return 'Máximo 50 caracteres.';
    return '';
  }

  protected get esValido(): boolean {
    return !this.errorCorreo && !this.errorContrasena && !this.errorNombres &&
           !this.errorApellidos && !this.errorTelefono;
  }

  protected generarContrasena(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.contrasena.set(pwd);
  }

  protected onGuardar(): void {
    this.mostrarErrores.set(true);
    if (!this.esValido || this.guardando()) return;

    this.errorMsg.set('');
    this.guardando.set(true);

    this.adminSvc.crearUsuario({
      correo:     this.correo(),
      contrasena: this.contrasena(),
      nombres:    this.nombres(),
      apellidos:  this.apellidos(),
      telefono:   this.telefono() || undefined,
      rol:        this.rol() === 'Administrador' ? 'ADMINISTRADOR' : 'STAFF',
    }).subscribe({
      next: result => {
        this.guardando.set(false);
        if (result.exitoso === 1) {
          this.idNuevo.set(result.idNuevo ?? 0);
          this.showExito.set(true);
        } else {
          this.errorMsg.set(result.mensaje || 'Error al crear el usuario.');
        }
      },
      error: err => {
        this.guardando.set(false);
        this.errorMsg.set(err?.error?.mensaje ?? 'Error al crear el usuario.');
      },
    });
  }
}
