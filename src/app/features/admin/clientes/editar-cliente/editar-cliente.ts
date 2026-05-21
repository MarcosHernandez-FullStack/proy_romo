import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Users, X, RefreshCw, AlertTriangle } from 'lucide-angular';
import { ClientesService } from '../../../../core/services/clientes.service';
import { ClienteB2B } from '../../../../models/clientes.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';

@Component({
  selector: 'app-editar-cliente',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent],
  templateUrl: './editar-cliente.html',
})
export class EditarClienteComponent implements OnInit {
  private readonly clientesSvc = inject(ClientesService);

  readonly cliente = input.required<ClienteB2B>();
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
  protected readonly mostrarErrores = signal(false);

  ngOnInit(): void {
    const c = this.cliente();
    this.empresa.set(c.empresa);
    this.contacto.set(c.contacto);
    this.correo.set(c.correo);
    this.telefono.set(c.telefono);
    this.loginId.set(c.loginId);
    this.tarifaBase.set(c.tarifaBase);
    this.tarifaKm.set(c.tarifaKm);
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

  protected get errorPassword(): string {
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
           !this.errorCorreo && !this.errorPassword &&
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

    const idNumerico = parseInt(this.cliente().id.replace('CLI-', ''), 10);

    this.clientesSvc.editarCliente(idNumerico, {
      contrasena:     this.password() || undefined,
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
          this.showExito.set(true);
        } else {
          this.errorMsg.set(result.mensaje || 'Error al actualizar el cliente.');
        }
      },
      error: err => {
        this.guardando.set(false);
        this.errorMsg.set(err?.error?.mensaje ?? 'Error al actualizar el cliente.');
      },
    });
  }
}
