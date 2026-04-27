import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCog, X, RefreshCw, AlertTriangle } from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';
import { Operador } from '../../../../models/admin.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';
import { MensajeModalComponent } from '../../../../shared/components/mensaje-modal/mensaje-modal';

@Component({
  selector: 'app-editar-operador',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent, MensajeModalComponent],
  templateUrl: './editar-operador.html',
})
export class EditarOperadorComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  readonly operador = input.required<Operador>();
  readonly guardar  = output<void>();
  readonly cerrar   = output<void>();

  protected readonly UserCogIcon       = UserCog;
  protected readonly XIcon             = X;
  protected readonly RefreshCwIcon     = RefreshCw;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly nombres             = signal('');
  protected readonly apellidos           = signal('');
  protected readonly correo              = signal('');
  protected readonly telefono            = signal('');
  protected readonly password            = signal('');
  protected readonly licencia            = signal('');
  protected readonly vencimientoLicencia = signal('');

  protected readonly loading        = signal(false);
  protected readonly showExito      = signal(false);
  protected readonly errorModal     = signal<string | null>(null);
  protected readonly mostrarErrores = signal(false);

  ngOnInit(): void {
    const o = this.operador();
    this.nombres.set(o.nombres);
    this.apellidos.set(o.apellidos);
    this.correo.set(o.correo);
    this.telefono.set(o.telefono);
    this.password.set('');
    this.licencia.set(o.licencia);
    this.vencimientoLicencia.set(o.vencimientoLicencia);
  }

  // ── Validaciones por campo ────────────────────────────────
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

  protected get errorPassword(): string {
    if (this.password().length > 20) return 'Máximo 20 caracteres.';
    return '';
  }

  protected get errorLicencia(): string {
    if (!this.licencia().trim()) return 'El número de licencia es obligatorio.';
    if (this.licencia().length > 9) return 'Máximo 9 caracteres.';
    return '';
  }

  protected get errorFecVencimiento(): string {
    if (!this.vencimientoLicencia()) return 'La fecha de vencimiento es obligatoria.';
    return '';
  }

  protected get esValido(): boolean {
    return !this.errorNombres && !this.errorApellidos && !this.errorCorreo &&
           !this.errorTelefono && !this.errorPassword && !this.errorLicencia &&
           !this.errorFecVencimiento;
  }

  protected get licenciaVenceProximo(): boolean {
    if (!this.vencimientoLicencia()) return false;
    const diff = (new Date(this.vencimientoLicencia()).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff < 15;
  }

  protected generarPassword(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.password.set(pwd);
  }

  protected onGuardar(): void {
    this.mostrarErrores.set(true);
    if (!this.esValido || this.loading()) return;

    const o = this.operador();
    const idNum = parseInt(o.id.replace('OP-', ''), 10);

    this.loading.set(true);
    this.adminSvc.editarOperador(idNum, {
      contrasena:  this.password(),
      nombres:     this.nombres(),
      apellidos:   this.apellidos(),
      correo:      this.correo(),
      telefono:    this.telefono(),
      rol:         'OPERADOR',
      nroLicencia: this.licencia(),
      fecVenLic:   this.vencimientoLicencia(),
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
