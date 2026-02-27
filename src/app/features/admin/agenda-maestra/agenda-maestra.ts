import { Component, OnInit, inject, signal } from '@angular/core';
import { LucideAngularModule, Clock, Calendar } from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { ExcepcionAgenda, HorarioRegular } from '../../../models/admin.model';
import { HorariosRegularesComponent } from './horarios-regulares/horarios-regulares';
import { ExcepcionesComponent } from './excepciones/excepciones';

type Tab = 'horarios' | 'excepciones';

@Component({
  selector: 'app-agenda-maestra',
  standalone: true,
  imports: [LucideAngularModule, HorariosRegularesComponent, ExcepcionesComponent],
  templateUrl: './agenda-maestra.html',
})
export class AgendaMaestraComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly ClockIcon = Clock;
  protected readonly CalendarIcon = Calendar;

  protected readonly tab = signal<Tab>('horarios');
  protected readonly reservasActivo = signal(true);
  protected readonly horarios = signal<HorarioRegular[]>([]);
  protected readonly excepciones = signal<ExcepcionAgenda[]>([]);

  ngOnInit(): void {
    this.adminSvc.getHorariosRegulares().subscribe((data) => this.horarios.set(data));
    this.adminSvc.getExcepciones().subscribe((data) => this.excepciones.set(data));
  }

  protected onAgregarExcepcion(exc: Omit<ExcepcionAgenda, 'id'>): void {
    const id = `EXC-${String(this.excepciones().length + 1).padStart(3, '0')}`;
    this.excepciones.update((prev) => [...prev, { ...exc, id }]);
  }

  protected onEliminarExcepcion(id: string): void {
    this.excepciones.update((prev) => prev.filter((e) => e.id !== id));
  }
}
