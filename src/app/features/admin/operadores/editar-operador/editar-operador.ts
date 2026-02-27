import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCog, X, RefreshCw, AlertTriangle } from 'lucide-angular';
import { Operador } from '../../../../models/admin.model';

@Component({
  selector: 'app-editar-operador',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './editar-operador.html',
})
export class EditarOperadorComponent implements OnInit {
  readonly operador = input.required<Operador>();
  readonly guardar = output<Operador>();
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

  ngOnInit(): void {
    const o = this.operador();
    this.loginId.set(o.loginId);
    this.password.set(o.password);
    this.nombre.set(o.nombre);
    this.telefono.set(o.telefono);
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
    const venc = new Date(this.vencimientoLicencia());
    const diff = (venc.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff < 15;
  }

  protected onGuardar(): void {
    this.guardar.emit({
      ...this.operador(),
      loginId: this.loginId(),
      password: this.password(),
      nombre: this.nombre(),
      telefono: this.telefono(),
      licencia: this.licencia(),
      vencimientoLicencia: this.vencimientoLicencia(),
    });
  }
}
