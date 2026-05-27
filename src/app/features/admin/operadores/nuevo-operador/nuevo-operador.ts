import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCog, X, RefreshCw, AlertTriangle } from 'lucide-angular';
import { OperadoresService } from '../../../../core/services/operadores.service';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner';

@Component({
  selector: 'app-nuevo-operador',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent, ErrorBannerComponent],
  templateUrl: './nuevo-operador.html',
})
export class NuevoOperadorComponent {
  readonly guardado = output<void>();
  readonly cerrar   = output<void>();

  protected readonly UserCogIcon       = UserCog;
  protected readonly XIcon             = X;
  protected readonly RefreshCwIcon     = RefreshCw;
  protected readonly AlertTriangleIcon = AlertTriangle;

  private readonly operadoresSvc = inject(OperadoresService);

  protected readonly alias       = signal('');
  protected readonly contrasena  = signal('');
  protected readonly nombres     = signal('');
  protected readonly apellidos   = signal('');
  protected readonly telefono    = signal('');
  protected readonly correo      = signal('');
  protected readonly nroLicencia = signal('');
  protected readonly fecVenLic   = signal('');

  protected readonly guardando      = signal(false);
  protected readonly errorMsg       = signal('');
  protected readonly showExito      = signal(false);
  protected readonly idNuevo        = signal(0);
  protected readonly mostrarErrores = signal(false);

  protected get idNuevoFormato(): string {
    return `OP-${String(this.idNuevo()).padStart(3, '0')}`;
  }

  // ── Validaciones por campo ────────────────────────────────
  protected get errorAlias(): string {
    if (!this.alias().trim()) return 'El ID de usuario es obligatorio.';
    if (this.alias().length > 10) return 'Máximo 10 caracteres.';
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

  protected get errorCorreo(): string {
    if (!this.correo().trim()) return 'El correo electrónico es obligatorio.';
    if (this.correo().length > 100) return 'Máximo 100 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo())) return 'Ingrese un correo válido.';
    return '';
  }

  protected get errorTelefono(): string {
    if (!this.telefono().trim()) return 'El teléfono es obligatorio.';
    if (this.telefono().length > 50) return 'Máximo 50 caracteres.';
    return '';
  }

  protected get errorNroLicencia(): string {
    if (!this.nroLicencia().trim()) return 'El número de licencia es obligatorio.';
    if (this.nroLicencia().length > 9) return 'Máximo 9 caracteres.';
    return '';
  }

  protected get errorFecVenLic(): string {
    if (!this.fecVenLic()) return 'La fecha de vencimiento es obligatoria.';
    return '';
  }

  protected get esValido(): boolean {
    return !this.errorAlias && !this.errorContrasena && !this.errorNombres &&
           !this.errorApellidos && !this.errorCorreo && !this.errorTelefono &&
           !this.errorNroLicencia && !this.errorFecVenLic;
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
    this.mostrarErrores.set(true);
    if (!this.esValido || this.guardando()) return;

    this.errorMsg.set('');
    this.guardando.set(true);

    this.operadoresSvc.crearOperador({
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
        this.errorMsg.set(err?.error?.mensaje ?? 'Error al crear el operador.');
      },
    });
  }
}
