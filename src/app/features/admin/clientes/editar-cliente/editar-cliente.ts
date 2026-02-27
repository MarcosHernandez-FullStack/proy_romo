import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Users, X, RefreshCw } from 'lucide-angular';
import { ClienteB2B } from '../../../../models/admin.model';

@Component({
  selector: 'app-editar-cliente',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './editar-cliente.html',
})
export class EditarClienteComponent implements OnInit {
  readonly cliente = input.required<ClienteB2B>();
  readonly guardar = output<ClienteB2B>();
  readonly cerrar = output<void>();

  protected readonly UsersIcon = Users;
  protected readonly XIcon = X;
  protected readonly RefreshCwIcon = RefreshCw;

  protected readonly empresa = signal('');
  protected readonly contacto = signal('');
  protected readonly correo = signal('');
  protected readonly telefono = signal('');
  protected readonly loginId = signal('');
  protected readonly password = signal('');
  protected readonly tarifaBase = signal(0);
  protected readonly tarifaKm = signal(0);

  ngOnInit(): void {
    const c = this.cliente();
    this.empresa.set(c.empresa);
    this.contacto.set(c.contacto);
    this.correo.set(c.correo);
    this.telefono.set(c.telefono);
    this.loginId.set(c.loginId);
    this.password.set(c.password);
    this.tarifaBase.set(c.tarifaBase);
    this.tarifaKm.set(c.tarifaKm);
  }

  protected generarPassword(): void {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const pwd = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.password.set(pwd);
  }

  protected onGuardar(): void {
    this.guardar.emit({
      ...this.cliente(),
      empresa: this.empresa(),
      contacto: this.contacto(),
      correo: this.correo(),
      telefono: this.telefono(),
      loginId: this.loginId(),
      password: this.password(),
      tarifaBase: this.tarifaBase(),
      tarifaKm: this.tarifaKm(),
    });
  }
}
