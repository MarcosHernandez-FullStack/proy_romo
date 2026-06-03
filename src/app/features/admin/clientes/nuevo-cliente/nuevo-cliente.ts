import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Users, X, RefreshCw } from 'lucide-angular';
import { ClientesService } from '../../../../core/services/clientes.service';
import { ErroresCliente } from '../../../../models/clientes.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner';

@Component({
  selector: 'app-nuevo-cliente',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent, ErrorBannerComponent],
  templateUrl: './nuevo-cliente.html',
})
export class NuevoClienteComponent {
  private readonly clientesSvc = inject(ClientesService);

  readonly guardar = output<void>();
  readonly cerrar  = output<void>();

  protected readonly UsersIcon     = Users;
  protected readonly XIcon         = X;
  protected readonly RefreshCwIcon = RefreshCw;

  protected readonly empresa    = signal('');
  protected readonly contacto   = signal('');
  protected readonly correo     = signal('');
  protected readonly telefono   = signal('');
  protected readonly loginId    = signal('');
  protected readonly password   = signal('');
  protected readonly tarifaBase = signal<number>(0);
  protected readonly tarifaKm   = signal<number>(0);

  protected readonly guardando     = signal(false);
  protected readonly errorMsg      = signal('');
  protected readonly showExito     = signal(false);
  protected readonly idNuevo       = signal(0);
  protected readonly intentoGuardar = signal(false);

  protected get idNuevoFormato(): string {
    return `CLI-${String(this.idNuevo()).padStart(3, '0')}`;
  }

  protected readonly errores = computed<ErroresCliente>(() => {
    const e: ErroresCliente = {};
    if (!this.intentoGuardar()) return e;

    if (!this.empresa().trim()) e.empresa = 'La razón social es obligatoria.';

    if (!this.contacto().trim()) e.contacto = 'El nombre de contacto es obligatorio.';

    if (!this.telefono().trim()) e.telefono = 'El teléfono es obligatorio.';

    if (!this.correo().trim()) e.correo = 'El correo electrónico es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo())) e.correo = 'Ingrese un correo válido.';

    if (!this.loginId().trim()) e.loginId = 'El ID de usuario es obligatorio.';

    if (!this.password().trim()) e.password = 'La contraseña es obligatoria.';
    else if (this.password().length < 8) e.password = 'Mínimo 8 caracteres.';

    if (this.tarifaBase() < 0.01) e.tarifaBase = 'La tarifa base debe ser mayor a 0.';
    else if (this.tarifaBase() > 99999999.99) e.tarifaBase = 'Valor fuera de rango.';

    if (this.tarifaKm() < 0.01) e.tarifaKm = 'La tarifa por km debe ser mayor a 0.';
    else if (this.tarifaKm() > 99999999.99) e.tarifaKm = 'Valor fuera de rango.';

    return e;
  });

  protected generarPassword(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.password.set(pwd);
  }

  protected onGuardar(): void {
    this.intentoGuardar.set(true);
    if (Object.keys(this.errores()).length > 0 || this.guardando()) return;

    this.errorMsg.set('');
    this.guardando.set(true);

    this.clientesSvc.crearCliente({
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
