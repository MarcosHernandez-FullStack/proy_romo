import { Component, OnInit, inject, signal } from '@angular/core';
import { LucideAngularModule, Clock, Calendar, Loader } from 'lucide-angular';
import { AgendaService } from '../../../core/services/agenda.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfiguracionService } from '../../../core/services/configuracion.service';
import { HorarioRegular } from '../../../models/agenda.model';
import { HorariosRegularesComponent } from './horarios-regulares/horarios-regulares';
import { ExcepcionesComponent } from './excepciones/excepciones';
import { ExitoModalComponent } from '../../../shared/components/exito-modal/exito-modal';

type Tab = 'horarios' | 'excepciones';

@Component({
  selector: 'app-agenda-maestra',
  standalone: true,
  imports: [LucideAngularModule, HorariosRegularesComponent, ExcepcionesComponent, ExitoModalComponent],
  templateUrl: './agenda-maestra.html',
})
export class AgendaMaestraComponent implements OnInit {
  private readonly agendaSvc        = inject(AgendaService);
  private readonly notifSvc         = inject(NotificationService);
  private readonly configuracionSvc = inject(ConfiguracionService);

  protected readonly ClockIcon    = Clock;
  protected readonly CalendarIcon = Calendar;
  protected readonly LoaderIcon   = Loader;

  protected readonly tab                  = signal<Tab>('horarios');
  protected readonly reservasActivo       = signal(true);
  protected readonly guardandoToggle      = signal(false);
  protected readonly horarios             = signal<HorarioRegular[]>([]);
  protected readonly guardando            = signal(false);
  protected readonly cargandoHorarios     = signal(true);
  protected readonly showExito      = signal(false);
  protected readonly tituloExito    = signal('');
  protected readonly mensajeExito   = signal('');
  protected readonly etiquetaExito  = signal('');
  protected readonly detalleExito   = signal('');

  ngOnInit(): void {
    this.reservasActivo.set(this.configuracionSvc.reservaClienteOn());
    this.agendaSvc.getHorariosRegulares().subscribe({
      next:  (data) => { this.horarios.set(data); this.cargandoHorarios.set(false); },
      error: ()     => this.cargandoHorarios.set(false),
    });
  }

  protected onToggleReservasActivo(): void {
    if (this.guardandoToggle()) return;
    const newValue = !this.reservasActivo();
    this.guardandoToggle.set(true);
    this.configuracionSvc.actualizarReservaClienteOn(newValue).subscribe({
      next: (res) => {
        this.guardandoToggle.set(false);
        if (res.exitoso === 1) {
          this.reservasActivo.set(newValue);
        } else {
          this.notifSvc.mostrar(res.mensaje || 'No se pudo actualizar el estado de reservas.', 'error');
        }
      },
      error: (err: any) => {
        this.guardandoToggle.set(false);
        const msg = err?.error?.mensaje as string | undefined;
        this.notifSvc.mostrar(msg ?? 'Error al actualizar el estado de reservas. Intente nuevamente.', 'error');
      },
    });
  }

  protected onGuardarHorarios(horarios: HorarioRegular[]): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.agendaSvc.guardarHorariosRegulares(horarios).subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.exitoso === 2) {
          this.notifSvc.mostrar(res.mensaje, 'advertencia');
        } else {
          this.horarios.set(horarios);
          this.tituloExito.set('¡Horarios Guardados!');
          this.mensajeExito.set(res.mensaje);
          this.etiquetaExito.set('');
          this.detalleExito.set('');
          this.showExito.set(true);
        }
      },
      error: (err: any) => {
        this.guardando.set(false);
        const msg = err?.error?.mensaje as string | undefined;
        this.notifSvc.mostrar(msg ?? 'Error al guardar los horarios. Intente nuevamente.', 'error');
      },
    });
  }

}
