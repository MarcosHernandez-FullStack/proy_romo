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
  protected readonly loading    = signal(false);
  protected readonly showExito  = signal(false);
  protected readonly errorModal = signal<string | null>(null);

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

  protected generarPassword(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.password.set(pwd);
  }

  protected get licenciaVenceProximo(): boolean {
    if (!this.vencimientoLicencia()) return false;
    const diff = (new Date(this.vencimientoLicencia()).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff < 15;
  }

  protected onGuardar(): void {
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
        const msg = err?.error?.mensaje ?? 'Error al actualizar el operador.';
        this.errorModal.set(msg);
      },
    });
  }
}
