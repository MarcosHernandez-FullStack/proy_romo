import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCog, X, RefreshCw, AlertTriangle } from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';

@Component({
  selector: 'app-nuevo-operador',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent],
  templateUrl: './nuevo-operador.html',
})
export class NuevoOperadorComponent {
  readonly guardado = output<void>();
  readonly cerrar   = output<void>();

  protected readonly UserCogIcon       = UserCog;
  protected readonly XIcon             = X;
  protected readonly RefreshCwIcon     = RefreshCw;
  protected readonly AlertTriangleIcon = AlertTriangle;

  private readonly adminSvc = inject(AdminService);

  protected readonly alias       = signal('');
  protected readonly contrasena  = signal('');
  protected readonly nombres     = signal('');
  protected readonly apellidos   = signal('');
  protected readonly telefono    = signal('');
  protected readonly correo      = signal('');
  protected readonly nroLicencia = signal('');
  protected readonly fecVenLic   = signal('');
  protected readonly guardando   = signal(false);
  protected readonly errorMsg    = signal('');
  protected readonly showExito = signal(false);
  protected readonly idNuevo  = signal(0);

  protected get idNuevoFormato(): string {
    return `OP-${String(this.idNuevo()).padStart(3, '0')}`;
  }

  protected get esValido(): boolean {
    return !!this.alias() &&
           !!this.contrasena() &&
           !!this.nombres() &&
           !!this.apellidos() &&
           !!this.correo() &&
           !!this.nroLicencia() &&
           !!this.fecVenLic();
  }

  protected get licenciaVenceProximo(): boolean {
    if (!this.fecVenLic()) return false;
    const diff = (new Date(this.fecVenLic()).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 15;
  }

  protected generarContrasena(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.contrasena.set(pwd);
  }

  protected onGuardar(): void {
    if (!this.esValido || this.guardando()) return;

    this.errorMsg.set('');
    this.guardando.set(true);

    this.adminSvc.crearOperador({
      alias:       this.alias(),
      contrasena:  this.contrasena(),
      nombres:     this.nombres(),
      apellidos:   this.apellidos(),
      telefono:    this.telefono(),
      correo:      this.correo(),
      rol:         'OPERADOR',
      nroLicencia: this.nroLicencia(),
      fecVenLic:   this.fecVenLic(),
    }).subscribe({
      next: result => {
        this.guardando.set(false);
        if (result.exitoso === 1) {
          this.idNuevo.set(result.idNuevo ?? 0);
          this.showExito.set(true);
        } else {
          this.errorMsg.set(result.mensaje || 'Error al crear el operador.');
        }
      },
      error: err => {
        this.guardando.set(false);
        const msg = err?.error?.mensaje ?? 'Error al crear el operador.';
        this.errorMsg.set(msg);
      },
    });
  }
}
