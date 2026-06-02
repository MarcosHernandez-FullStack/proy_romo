import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserPlus, X, RefreshCw } from 'lucide-angular';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ErroresUsuario, RolUsuario } from '../../../../models/usuario.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner';

@Component({
  selector: 'app-nuevo-usuario',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent, ErrorBannerComponent],
  templateUrl: './nuevo-usuario.html',
})
export class NuevoUsuarioComponent {
  private readonly usuarioSvc = inject(UsuarioService);

  readonly guardar = output<void>();
  readonly cerrar  = output<void>();

  protected readonly UserPlusIcon   = UserPlus;
  protected readonly XIcon         = X;
  protected readonly RefreshCwIcon = RefreshCw;

  readonly roles: RolUsuario[] = ['ADMINISTRADOR', 'STAFF'];

  protected readonly correo     = signal('');
  protected readonly contrasena = signal('');
  protected readonly nombres    = signal('');
  protected readonly apellidos  = signal('');
  protected readonly telefono   = signal('');
  protected readonly rol        = signal<RolUsuario>('STAFF');

  protected readonly guardando      = signal(false);
  protected readonly errorMsg       = signal('');
  protected readonly exitoModal     = signal<{ titulo: string; mensaje: string; detalle: string } | null>(null);
  protected readonly intentoGuardar = signal(false);

  protected readonly errores = computed<ErroresUsuario>(() => {
    const e: ErroresUsuario = {};
    if (!this.intentoGuardar()) return e;
    if (!this.correo().trim())                e.correo    = 'El correo electrónico es obligatorio.';
    else if (this.correo().length > 100)      e.correo    = 'Máximo 100 caracteres.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo())) e.correo = 'Ingrese un correo válido.';
    if (!this.contrasena().trim())            e.contrasena = 'La contraseña es obligatoria.';
    else if (this.contrasena().length < 8)    e.contrasena = 'Mínimo 8 caracteres.';
    else if (this.contrasena().length > 20)   e.contrasena = 'Máximo 20 caracteres.';
    if (!this.nombres().trim())               e.nombres   = 'Los nombres son obligatorios.';
    else if (this.nombres().length > 100)     e.nombres   = 'Máximo 100 caracteres.';
    if (!this.apellidos().trim())             e.apellidos = 'Los apellidos son obligatorios.';
    else if (this.apellidos().length > 100)   e.apellidos = 'Máximo 100 caracteres.';
    if (!this.telefono().trim())              e.telefono  = 'El teléfono es obligatorio.';
    else if (this.telefono().length > 50)     e.telefono  = 'Máximo 50 caracteres.';
    return e;
  });

  protected generarContrasena(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.contrasena.set(pwd);
  }

  protected onGuardar(): void {
    this.intentoGuardar.set(true);
    if (Object.keys(this.errores()).length > 0 || this.guardando()) return;

    this.errorMsg.set('');
    this.guardando.set(true);

    this.usuarioSvc.crearUsuario({
      correo:     this.correo(),
      contrasena: this.contrasena(),
      nombres:    this.nombres(),
      apellidos:  this.apellidos(),
      telefono:   this.telefono() || undefined,
      rol:        this.rol(),
    }).subscribe({
      next: result => {
        this.guardando.set(false);
        if (result.exitoso === 1) {
          this.exitoModal.set({ titulo: '¡Usuario Creado!', mensaje: result.mensaje, detalle: String(result.idNuevo ?? 0) });
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
