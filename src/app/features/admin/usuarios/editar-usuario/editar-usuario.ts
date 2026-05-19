import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCog, X, RefreshCw, AlertTriangle } from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';
import { RolUsuario, UsuarioAdmin } from '../../../../models/admin.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent],
  templateUrl: './editar-usuario.html',
})
export class EditarUsuarioComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  readonly usuario = input.required<UsuarioAdmin>();
  readonly guardar = output<void>();
  readonly cerrar  = output<void>();

  protected readonly UserCogIcon        = UserCog;
  protected readonly XIcon             = X;
  protected readonly RefreshCwIcon     = RefreshCw;
  protected readonly AlertTriangleIcon = AlertTriangle;

  readonly roles: RolUsuario[] = ['ADMINISTRADOR', 'STAFF'];

  protected readonly contrasena = signal('');
  protected readonly nombres    = signal('');
  protected readonly apellidos  = signal('');
  protected readonly telefono   = signal('');
  protected readonly rol        = signal<RolUsuario>('STAFF');

  protected readonly guardando      = signal(false);
  protected readonly errorMsg       = signal('');
  protected readonly exitoModal     = signal<{ titulo: string; mensaje: string; detalle: string } | null>(null);
  protected readonly mostrarErrores = signal(false);

  ngOnInit(): void {
    const u = this.usuario();
    this.nombres.set(u.nombres);
    this.apellidos.set(u.apellidos);
    this.telefono.set(u.telefono);
    this.rol.set(u.rol);
  }

  // ── Validaciones ─────────────────────────────────────────
  protected get errorContrasena(): string {
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
    return !this.errorNombres && !this.errorApellidos &&
           !this.errorTelefono && !this.errorContrasena;
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

    this.adminSvc.editarUsuario(this.usuario().id, {
      contrasena: this.contrasena() || undefined,
      nombres:    this.nombres(),
      apellidos:  this.apellidos(),
      telefono:   this.telefono() || undefined,
      correo:     this.usuario().correo,
      rol:        this.rol(),
    }).subscribe({
      next: result => {
        this.guardando.set(false);
        if (result.exitoso === 1) {
          this.exitoModal.set({ titulo: '¡Usuario Actualizado!', mensaje: result.mensaje, detalle: String(this.usuario().id) });
        } else {
          this.errorMsg.set(result.mensaje || 'Error al actualizar el usuario.');
        }
      },
      error: err => {
        this.guardando.set(false);
        this.errorMsg.set(err?.error?.mensaje ?? 'Error al actualizar el usuario.');
      },
    });
  }
}
