import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCog, X, RefreshCw, AlertTriangle } from 'lucide-angular';
import { OperadoresService } from '../../../../core/services/operadores.service';
import { ErroresOperador, Operador } from '../../../../models/operadores.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner';

@Component({
  selector: 'app-editar-operador',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent, ErrorBannerComponent],
  templateUrl: './editar-operador.html',
})
export class EditarOperadorComponent implements OnInit {
  private readonly operadoresSvc = inject(OperadoresService);

  readonly operador = input.required<Operador>();
  readonly guardar  = output<void>();
  readonly cerrar   = output<void>();

  protected readonly UserCogIcon       = UserCog;
  protected readonly XIcon             = X;
  protected readonly RefreshCwIcon     = RefreshCw;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly nombres     = signal('');
  protected readonly apellidos   = signal('');
  protected readonly correo      = signal('');
  protected readonly telefono    = signal('');
  protected readonly contrasena  = signal('');
  protected readonly nroLicencia = signal('');
  protected readonly fecVenLic   = signal('');

  protected readonly loading        = signal(false);
  protected readonly showExito      = signal(false);
  protected readonly errorModal     = signal<string | null>(null);
  protected readonly intentoGuardar = signal(false);

  ngOnInit(): void {
    const o = this.operador();
    this.nombres.set(o.nombres);
    this.apellidos.set(o.apellidos);
    this.correo.set(o.correo);
    this.telefono.set(o.telefono ?? '');
    this.contrasena.set('');
    this.nroLicencia.set(o.nroLicencia);
    this.fecVenLic.set(this.toIso(o.fecVenLic));
  }

  private toIso(fec: string): string {
    const parts = fec.split('/');
    if (parts.length !== 3) return fec;
    const [d, m, y] = parts;
    return `${y}-${m}-${d}`;
  }

  protected get licenciaVenceProximo(): boolean {
    if (!this.fecVenLic()) return false;
    const diff = (new Date(this.fecVenLic()).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff < 15;
  }

  protected readonly errores = computed<ErroresOperador>(() => {
    const e: ErroresOperador = {};
    if (!this.intentoGuardar()) return e;
    if (!this.nombres().trim())               e.nombres     = 'Los nombres son obligatorios.';
    else if (this.nombres().length > 100)     e.nombres     = 'Máximo 100 caracteres.';
    if (!this.apellidos().trim())             e.apellidos   = 'Los apellidos son obligatorios.';
    else if (this.apellidos().length > 100)   e.apellidos   = 'Máximo 100 caracteres.';
    if (!this.correo().trim())                e.correo      = 'El correo electrónico es obligatorio.';
    else if (this.correo().length > 100)      e.correo      = 'Máximo 100 caracteres.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo())) e.correo = 'Ingrese un correo válido.';
    if (!this.telefono().trim())              e.telefono    = 'El teléfono es obligatorio.';
    else if (this.telefono().length > 50)     e.telefono    = 'Máximo 50 caracteres.';
    if (this.contrasena()) {
      if (this.contrasena().length < 8)       e.contrasena  = 'Mínimo 8 caracteres.';
      else if (this.contrasena().length > 20) e.contrasena  = 'Máximo 20 caracteres.';
    }
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
    if (Object.keys(this.errores()).length > 0 || this.loading()) return;

    this.loading.set(true);
    this.operadoresSvc.editarOperador(this.operador().id, {
      contrasena:  this.contrasena(),
      nombres:     this.nombres(),
      apellidos:   this.apellidos(),
      correo:      this.correo(),
      telefono:    this.telefono(),
      rol:         'OPERADOR',
      nroLicencia: this.nroLicencia(),
      fecVenLic:   this.fecVenLic(),
    }).subscribe({
      next: result => {
        this.loading.set(false);
        if (result.exitoso === 1) {
          this.showExito.set(true);
        } else {
          this.errorModal.set(result.mensaje || 'Error al actualizar el operador.');
        }
      },
      error: err => {
        this.loading.set(false);
        this.errorModal.set(err?.error?.mensaje ?? 'Error al actualizar el operador.');
      },
    });
  }
}
