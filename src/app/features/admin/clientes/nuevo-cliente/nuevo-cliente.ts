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
  protected readonly tarifaBase = signal<number>(0);
  protected readonly tarifaKm   = signal<number>(0);

  protected readonly guardando      = signal(false);
  protected readonly errorMsg       = signal('');
  protected readonly showExito      = signal(false);
  protected readonly idNuevo        = signal(0);
  protected readonly mostrarErrores = signal(false);

  protected get idNuevoFormato(): string {
    return `CLI-${String(this.idNuevo()).padStart(3, '0')}`;
  }

  // ── Validaciones por campo ────────────────────────────────
  protected get errorEmpresa(): string {
    if (!this.empresa().trim()) return 'La razón social es obligatoria.';
    if (this.empresa().length > 100) return 'Máximo 100 caracteres.';
    return '';
  }

  protected get errorContacto(): string {
    if (!this.contacto().trim()) return 'El nombre de contacto es obligatorio.';
    if (this.contacto().length > 50) return 'Máximo 50 caracteres.';
    return '';
  }

  protected get errorTelefono(): string {
    if (!this.telefono().trim()) return 'El teléfono es obligatorio.';
    if (this.telefono().length > 20) return 'Máximo 20 caracteres.';
    return '';
  }

  protected get errorCorreo(): string {
    if (!this.correo().trim()) return 'El correo electrónico es obligatorio.';
    if (this.correo().length > 100) return 'Máximo 100 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo())) return 'Ingrese un correo válido.';
    return '';
  }

  protected get errorLoginId(): string {
    if (!this.loginId().trim()) return 'El ID de usuario es obligatorio.';
    if (this.loginId().length > 10) return 'Máximo 10 caracteres.';
    return '';
  }

  protected get errorPassword(): string {
    if (!this.password().trim()) return 'La contraseña es obligatoria.';
    if (this.password().length > 20) return 'Máximo 20 caracteres.';
    return '';
  }

  protected get errorTarifaBase(): string {
    if (this.tarifaBase() < 0) return 'La tarifa no puede ser negativa.';
    if (this.tarifaBase() > 99999999.99) return 'Valor fuera de rango.';
    return '';
  }

  protected get errorTarifaKm(): string {
    if (this.tarifaKm() < 0) return 'La tarifa no puede ser negativa.';
    if (this.tarifaKm() > 99999999.99) return 'Valor fuera de rango.';
    return '';
  }

  protected get esValido(): boolean {
    return !this.errorEmpresa && !this.errorContacto && !this.errorTelefono &&
           !this.errorCorreo && !this.errorLoginId && !this.errorPassword &&
           !this.errorTarifaBase && !this.errorTarifaKm;
  }

  protected generarPassword(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.password.set(pwd);
  }

  protected onGuardar(): void {
    this.mostrarErrores.set(true);
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
