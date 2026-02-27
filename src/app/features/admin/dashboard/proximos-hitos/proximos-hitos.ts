import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Calendar, Clock, Truck, Users, ArrowRight } from 'lucide-angular';

export interface ProximoHito {
  hora: string;
  id: string;
  placa: string;
  operador: string | null;
  cliente: string;
  critico: boolean;
}

@Component({
  selector: 'app-proximos-hitos',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './proximos-hitos.html',
})
export class ProximosHitosComponent {
  readonly hitos = input.required<ProximoHito[]>();

  protected readonly CalendarIcon = Calendar;
  protected readonly ClockIcon = Clock;
  protected readonly TruckIcon = Truck;
  protected readonly UsersIcon = Users;
  protected readonly ArrowRightIcon = ArrowRight;
}
