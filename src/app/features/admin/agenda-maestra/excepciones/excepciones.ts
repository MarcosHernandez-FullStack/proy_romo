import { Component, input, output, signal } from '@angular/core';
import { LucideAngularModule, AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-angular';
import { ExcepcionAgenda } from '../../../../models/admin.model';
import { NuevaExcepcionComponent } from './nueva-excepcion/nueva-excepcion';

@Component({
  selector: 'app-excepciones',
  standalone: true,
  imports: [LucideAngularModule, NuevaExcepcionComponent],
  templateUrl: './excepciones.html',
})
export class ExcepcionesComponent {
  readonly excepciones = input.required<ExcepcionAgenda[]>();
  readonly agregar = output<Omit<ExcepcionAgenda, 'id'>>();
  readonly eliminar = output<string>();

  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly PlusIcon = Plus;
  protected readonly PencilIcon = Pencil;
  protected readonly Trash2Icon = Trash2;

  protected readonly showNuevaExcepcion = signal(false);

  protected excepcionTipoBadgeClass(tipo: string): string {
    switch (tipo) {
      case 'Festivo': return 'bg-[#f3e8ff] text-[#7e22ce] border border-[#d8b4fe]';
      case 'Mantenimiento': return 'bg-[#fffbeb] text-[#bb4d00] border border-[#ffd230]';
      default: return 'bg-[#fee2e2] text-[#c10007] border border-[#fca5a5]';
    }
  }

  protected onGuardarExcepcion(exc: Omit<ExcepcionAgenda, 'id'>): void {
    this.agregar.emit(exc);
    this.showNuevaExcepcion.set(false);
  }
}
