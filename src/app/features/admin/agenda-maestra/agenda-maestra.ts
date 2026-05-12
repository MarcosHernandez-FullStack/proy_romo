import { Component, OnInit, inject, signal } from '@angular/core';
import { LucideAngularModule, Clock, Calendar, Loader } from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ExcepcionAgenda, HorarioRegular } from '../../../models/admin.model';
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
  private readonly adminSvc  = inject(AdminService);
  private readonly notifSvc  = inject(NotificationService);

  protected readonly ClockIcon    = Clock;
  protected readonly CalendarIcon = Calendar;
  protected readonly LoaderIcon   = Loader;

  protected readonly tab              = signal<Tab>('horarios');
  protected readonly reservasActivo   = signal(true);
  protected readonly horarios         = signal<HorarioRegular[]>([]);
  protected readonly excepciones      = signal<ExcepcionAgenda[]>([]);
  protected readonly guardando         = signal(false);
  protected readonly cargandoHorarios  = signal(true);
  protected readonly showExito         = signal(false);
  protected readonly mensajeExito      = signal('');

  ngOnInit(): void {
    this.adminSvc.getHorariosRegulares().subscribe({
      next:  (data) => { this.horarios.set(data); this.cargandoHorarios.set(false); },
      error: ()     => this.cargandoHorarios.set(false),
    });
    this.adminSvc.getExcepciones().subscribe((data) => this.excepciones.set(data));
  }

  protected onGuardarHorarios(horarios: HorarioRegular[]): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.adminSvc.guardarHorariosRegulares(horarios).subscribe({
      next: (res) => {
        this.guardando.set(false);
        if (res.exitoso === 2) {
          this.notifSvc.mostrar(res.mensaje, 'advertencia');
        } else {
          this.horarios.set(horarios);
          this.mensajeExito.set(res.mensaje);
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

  protected onAgregarExcepcion(exc: Omit<ExcepcionAgenda, 'id'>): void {
    const id = `EXC-${String(this.excepciones().length + 1).padStart(3, '0')}`;
    this.excepciones.update((prev) => [...prev, { ...exc, id }]);
  }

  protected onEliminarExcepcion(id: string): void {
    this.excepciones.update((prev) => prev.filter((e) => e.id !== id));
  }
}
