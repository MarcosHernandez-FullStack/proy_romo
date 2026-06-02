import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Calendar, X, AlertTriangle, Clock, Loader } from 'lucide-angular';
import { AlcanceExcepcion, ErroresExcepcion, ExcepcionAgenda, TipoExcepcion } from '../../../../../models/agenda.model';
import { ErrorBannerComponent } from '../../../../../shared/components/error-banner/error-banner';

@Component({
  selector: 'app-nueva-excepcion',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ErrorBannerComponent],
  templateUrl: './nueva-excepcion.html',
})
export class NuevaExcepcionComponent {
  readonly guardando   = input<boolean>(false);
  readonly errorModal  = input<string | null>(null);
  readonly guardar     = output<Omit<ExcepcionAgenda, 'id'>>();
  readonly cerrar      = output<void>();

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
  protected readonly intentoGuardar    = signal(false);

  protected readonly tiposExcepcion: TipoExcepcion[] = ['Feriado', 'Mantenimiento', 'Bloqueo'];

  protected readonly horas: string[] = Array.from({ length: 24 }, (_, i) =>
    `${i.toString().padStart(2, '0')}:00`
  );

  protected get hoyMin(): string {
    return new Date().toISOString().split('T')[0];
  }

  protected readonly errores = computed<ErroresExcepcion>(() => {
    const e: ErroresExcepcion = {};
    if (!this.intentoGuardar()) return e;
    const hoy = this.hoyMin;
    if (!this.fecha()) e['fecha'] = 'La fecha de la excepción es obligatoria';
    else if (this.fecha() < hoy) e['fecha'] = 'La fecha no puede ser anterior a hoy';
    if (!this.descripcionMotivo().trim()) e['descripcionMotivo'] = 'La descripción del motivo es obligatoria';
    if (this.alcance() === 'Rango de Horas Específico') {
      if (!this.tiempoInicio()) e['tiempoInicio'] = 'Debe seleccionar la hora de inicio';
      if (!this.tiempoFinal()) e['tiempoFinal'] = 'Debe seleccionar la hora de fin';
      else if (this.tiempoInicio() && this.tiempoFinal() <= this.tiempoInicio())
        e['tiempoFinal'] = 'La hora de fin debe ser posterior a la hora de inicio';
    }
    return e;
  });

  protected onGuardar(): void {
    this.intentoGuardar.set(true);
    if (Object.keys(this.errores()).length > 0) return;
    const exc: Omit<ExcepcionAgenda, 'id'> = {
      fechaFormatCorta:  this.fecha(),
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
