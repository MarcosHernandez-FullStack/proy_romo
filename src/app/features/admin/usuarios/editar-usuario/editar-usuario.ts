import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserCog, X, Mail, Lock } from 'lucide-angular';
import { RolUsuario, UsuarioAdmin } from '../../../../models/admin.model';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './editar-usuario.html',
})
export class EditarUsuarioComponent implements OnInit {
  readonly usuario = input.required<UsuarioAdmin>();
  readonly guardar = output<UsuarioAdmin>();
  readonly cerrar = output<void>();

  protected readonly UserCogIcon = UserCog;
  protected readonly XIcon = X;
  protected readonly MailIcon = Mail;
  protected readonly LockIcon = Lock;

  readonly roles: RolUsuario[] = ['Administrador', 'Staff'];

  protected readonly nombre = signal('');
  protected readonly rol = signal<RolUsuario>('Staff');
  protected readonly nuevaPassword = signal('');

  protected get esValido(): boolean {
    return !!this.nombre().trim();
  }

  ngOnInit(): void {
    const u = this.usuario();
    this.nombre.set(u.nombre);
    this.rol.set(u.rol);
  }

  protected onGuardar(): void {
    if (!this.esValido) return;
    this.guardar.emit({
      ...this.usuario(),
      nombre: this.nombre(),
      rol: this.rol(),
    });
  }
}
