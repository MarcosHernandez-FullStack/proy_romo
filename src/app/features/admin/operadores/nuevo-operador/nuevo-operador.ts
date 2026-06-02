import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCog, X, RefreshCw, AlertTriangle } from 'lucide-angular';
import { OperadoresService } from '../../../../core/services/operadores.service';
import { ErroresOperador } from '../../../../models/operadores.model';
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
  protected readonly intentoGuardar = signal(false);

  protected get idNuevoFormato(): string {
    return `OP-${String(this.idNuevo()).padStart(3, '0')}`;
  }

  protected get licenciaVenceProximo(): boolean {
    if (!this.fecVenLic()) return false;
    const diff = (new Date(this.fecVenLic()).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 15;
  }

  protected readonly errores = computed<ErroresOperador>(() => {
    const e: ErroresOperador = {};
    if (!this.intentoGuardar()) return e;
    if (!this.alias().trim())                 e.alias       = 'El ID de usuario es obligatorio.';
    else if (this.alias().length > 10)        e.alias       = 'Máximo 10 caracteres.';
    if (!this.contrasena().trim())            e.contrasena  = 'La contraseña es obligatoria.';
    else if (this.contrasena().length < 8)    e.contrasena  = 'Mínimo 8 caracteres.';
    else if (this.contrasena().length > 20)   e.contrasena  = 'Máximo 20 caracteres.';
    if (!this.nombres().trim())               e.nombres     = 'Los nombres son obligatorios.';
    else if (this.nombres().length > 100)     e.nombres     = 'Máximo 100 caracteres.';
    if (!this.apellidos().trim())             e.apellidos   = 'Los apellidos son obligatorios.';
    else if (this.apellidos().length > 100)   e.apellidos   = 'Máximo 100 caracteres.';
    if (!this.telefono().trim())              e.telefono    = 'El teléfono es obligatorio.';
    else if (this.telefono().length > 50)     e.telefono    = 'Máximo 50 caracteres.';
    if (!this.correo().trim())                e.correo      = 'El correo electrónico es obligatorio.';
    else if (this.correo().length > 100)      e.correo      = 'Máximo 100 caracteres.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo())) e.correo = 'Ingrese un correo válido.';
    if (!this.nroLicencia().trim())           e.nroLicencia = 'El número de licencia es obligatorio.';
    else if (this.nroLicencia().length > 9)   e.nroLicencia = 'Máximo 9 caracteres.';
    if (!this.fecVenLic())                    e.fecVenLic   = 'La fecha de vencimiento es obligatoria.';
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
