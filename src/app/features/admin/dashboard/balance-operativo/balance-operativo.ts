import { Component, input } from '@angular/core';
import { LucideAngularModule, Truck, Users } from 'lucide-angular';

@Component({
  selector: 'app-balance-operativo',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './balance-operativo.html',
})
export class BalanceOperativoComponent {
  readonly operadoresDisponibles = input.required<number>();

  protected readonly TruckIcon = Truck;
  protected readonly UsersIcon = Users;
}
