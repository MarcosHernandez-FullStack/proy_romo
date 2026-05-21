import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Calendar, X, AlertTriangle, Clock, Loader } from 'lucide-angular';
import { AlcanceExcepcion, ExcepcionAgenda, TipoExcepcion } from '../../../../../models/agenda.model';

@Component({
  selector: 'app-nueva-excepcion',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './nueva-excepcion.html',
})
export class NuevaExcepcionComponent {
  readonly guardando = input<boolean>(false);
  readonly guardar   = output<Omit<ExcepcionAgenda, 'id'>>();
  readonly cerrar    = output<void>();

  protected readonly CalendarIcon      = Calendar;
  protected readonly XIcon             = X;
  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly ClockIcon         = Clock;
  protected readonly LoaderIcon        = Loader;

  protected readonly fecha             = signal('');
  protected readonly motivo            = signal<TipoExcepcion>('Feriado');
  protected readonly alcance           = signal<AlcanceExcepcion>('Día Completo');
  protected readonly tiempoInicio      = signal('');
  protected readonly tiempoFinal       = signal('');
  protected readonly descripcionMotivo = signal('');

  protected readonly tiposExcepcion: TipoExcepcion[] = ['Feriado', 'Mantenimiento', 'Bloqueo'];

  protected readonly horas: string[] = Array.from({ length: 24 }, (_, i) =>
    `${i.toString().padStart(2, '0')}:00`
  );

  protected get esValido(): boolean {
    if (!this.fecha() || !this.descripcionMotivo()) return false;
    if (this.alcance() === 'Rango de Horas Específico') {
      return !!this.tiempoInicio() && !!this.tiempoFinal();
    }
    return true;
  }

  protected onGuardar(): void {
    if (!this.esValido) return;
    const exc: Omit<ExcepcionAgenda, 'id'> = {
      fecha:             this.fecha(),
      motivo:            this.motivo(),
      alcance:           this.alcance(),
      tiempoInicio:      this.alcance() === 'Día Completo' ? '00:00' : this.tiempoInicio(),
      tiempoFinal:       this.alcance() === 'Día Completo' ? '23:59' : this.tiempoFinal(),
      descripcionMotivo: this.descripcionMotivo(),
      estado:            'ACTIVO',
    };
    this.guardar.emit(exc);
  }
}
