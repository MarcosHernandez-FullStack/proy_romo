import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Users, X, RefreshCw, AlertTriangle } from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';
import { ClienteB2B } from '../../../../models/admin.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';

@Component({
  selector: 'app-editar-cliente',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent],
  templateUrl: './editar-cliente.html',
})
export class EditarClienteComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

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
  protected readonly tarifaBase = signal(0);
  protected readonly tarifaKm   = signal(0);

  protected readonly guardando = signal(false);
  protected readonly errorMsg  = signal('');
  protected readonly showExito = signal(false);

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

  protected generarPassword(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.password.set(pwd);
  }

  protected onGuardar(): void {
    if (this.guardando()) return;

    this.errorMsg.set('');
    this.guardando.set(true);

    const idNumerico = parseInt(this.cliente().id.replace('CLI-', ''), 10);

    this.adminSvc.editarCliente(idNumerico, {
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
