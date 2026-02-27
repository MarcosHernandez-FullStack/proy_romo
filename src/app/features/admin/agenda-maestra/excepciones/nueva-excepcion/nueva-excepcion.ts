import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Calendar, X, AlertTriangle } from 'lucide-angular';
import { ExcepcionAgenda, TipoExcepcion, AlcanceExcepcion } from '../../../../../models/admin.model';

@Component({
  selector: 'app-nueva-excepcion',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './nueva-excepcion.html',
})
export class NuevaExcepcionComponent {
  readonly guardar = output<Omit<ExcepcionAgenda, 'id'>>();
  readonly cerrar = output<void>();

  protected readonly CalendarIcon = Calendar;
  protected readonly XIcon = X;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly fecha = signal('');
  protected readonly tipo = signal<TipoExcepcion>('Festivo');
  protected readonly alcance = signal<AlcanceExcepcion>('Día Completo');
  protected readonly horaInicio = signal('');
  protected readonly horaFin = signal('');
  protected readonly motivo = signal('');

  protected readonly tiposExcepcion: TipoExcepcion[] = ['Festivo', 'Mantenimiento', 'Bloqueo'];
  protected readonly alcancesExcepcion: AlcanceExcepcion[] = ['Día Completo', 'Rango de Horas'];

  protected get esValido(): boolean {
    return !!this.fecha() && !!this.motivo();
  }

  protected onGuardar(): void {
    if (!this.esValido) return;
    const exc: Omit<ExcepcionAgenda, 'id'> = {
      fecha: this.fecha(),
      tipo: this.tipo(),
      alcance: this.alcance(),
      motivo: this.motivo(),
      ...(this.alcance() === 'Rango de Horas' && {
        horaInicio: this.horaInicio(),
        horaFin: this.horaFin(),
      }),
    };
    this.guardar.emit(exc);
  }
}
