import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCog, X, RefreshCw } from 'lucide-angular';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ErroresUsuario, RolUsuario, UsuarioAdmin } from '../../../../models/usuario.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent, ErrorBannerComponent],
  templateUrl: './editar-usuario.html',
})
export class EditarUsuarioComponent implements OnInit {
  private readonly usuarioSvc = inject(UsuarioService);

  readonly usuario = input.required<UsuarioAdmin>();
  readonly guardar = output<void>();
  readonly cerrar  = output<void>();

  protected readonly UserCogIcon   = UserCog;
  protected readonly XIcon         = X;
  protected readonly RefreshCwIcon = RefreshCw;

  readonly roles: RolUsuario[] = ['ADMINISTRADOR', 'STAFF'];

  protected readonly contrasena = signal('');
  protected readonly nombres    = signal('');
  protected readonly apellidos  = signal('');
  protected readonly telefono   = signal('');
  protected readonly rol        = signal<RolUsuario>('STAFF');

  protected readonly guardando      = signal(false);
  protected readonly errorMsg       = signal('');
  protected readonly exitoModal     = signal<{ titulo: string; mensaje: string; detalle: string } | null>(null);
  protected readonly intentoGuardar = signal(false);

  ngOnInit(): void {
    const u = this.usuario();
    this.nombres.set(u.nombres);
    this.apellidos.set(u.apellidos);
    this.telefono.set(u.telefono);
    this.rol.set(u.rol);
  }

  protected readonly errores = computed<ErroresUsuario>(() => {
    const e: ErroresUsuario = {};
    if (!this.intentoGuardar()) return e;
    if (!this.nombres().trim())               e.nombres   = 'Los nombres son obligatorios.';
    else if (this.nombres().length > 100)     e.nombres   = 'Máximo 100 caracteres.';
    if (!this.apellidos().trim())             e.apellidos = 'Los apellidos son obligatorios.';
    else if (this.apellidos().length > 100)   e.apellidos = 'Máximo 100 caracteres.';
    if (!this.telefono().trim())              e.telefono  = 'El teléfono es obligatorio.';
    else if (this.telefono().length > 50)     e.telefono  = 'Máximo 50 caracteres.';
    if (this.contrasena()) {
      if (this.contrasena().length < 8)       e.contrasena = 'Mínimo 8 caracteres.';
      else if (this.contrasena().length > 20) e.contrasena = 'Máximo 20 caracteres.';
    }
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

    this.usuarioSvc.editarUsuario(this.usuario().id, {
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
