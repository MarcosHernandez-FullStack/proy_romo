import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserPlus, X, Info, Mail } from 'lucide-angular';
import { RolUsuario, UsuarioAdmin } from '../../../../models/admin.model';

@Component({
  selector: 'app-nuevo-usuario',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './nuevo-usuario.html',
})
export class NuevoUsuarioComponent {
  readonly guardar = output<Omit<UsuarioAdmin, 'id'>>();
  readonly cerrar = output<void>();

  protected readonly UserPlusIcon = UserPlus;
  protected readonly XIcon = X;
  protected readonly InfoIcon = Info;
  protected readonly MailIcon = Mail;

  readonly roles: RolUsuario[] = ['Administrador', 'Staff'];

  protected readonly nombre = signal('');
  protected readonly correo = signal('');
  protected readonly rol = signal<RolUsuario>('Staff');

  protected get esValido(): boolean {
    return !!this.nombre().trim() && !!this.correo().trim() && this.correo().includes('@');
  }

  protected onGuardar(): void {
    if (!this.esValido) return;
    const now = new Date();
    const fecha = now.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
    this.guardar.emit({
      nombre: this.nombre(),
      correo: this.correo(),
      rol: this.rol(),
      fechaCreacion: fecha,
      activo: true,
    });
  }
}
