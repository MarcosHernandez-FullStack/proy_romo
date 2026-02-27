import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCog, X, RefreshCw, AlertTriangle } from 'lucide-angular';
import { Operador } from '../../../../models/admin.model';

@Component({
  selector: 'app-nuevo-operador',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './nuevo-operador.html',
})
export class NuevoOperadorComponent {
  readonly guardar = output<Omit<Operador, 'id'>>();
  readonly cerrar = output<void>();

  protected readonly UserCogIcon = UserCog;
  protected readonly XIcon = X;
  protected readonly RefreshCwIcon = RefreshCw;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly loginId = signal('');
  protected readonly password = signal('');
  protected readonly nombre = signal('');
  protected readonly telefono = signal('');
  protected readonly licencia = signal('');
  protected readonly vencimientoLicencia = signal('');

  protected get esValido(): boolean {
    return !!this.nombre() && !!this.loginId() && !!this.password() && !!this.licencia();
  }

  protected generarPassword(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.password.set(pwd);
  }

  protected get licenciaVenceProximo(): boolean {
    if (!this.vencimientoLicencia()) return false;
    const venc = new Date(this.vencimientoLicencia());
    const diff = (venc.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff < 15;
  }

  protected onGuardar(): void {
    if (!this.esValido) return;
    this.guardar.emit({
      nombre: this.nombre(),
      telefono: this.telefono(),
      loginId: this.loginId(),
      password: this.password(),
      licencia: this.licencia(),
      vencimientoLicencia: this.vencimientoLicencia(),
      proximoServicio: null,
      activo: true,
    });
  }
}
