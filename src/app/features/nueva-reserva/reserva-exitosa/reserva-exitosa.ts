import { Component, input, output } from '@angular/core';
import { LucideAngularModule, CircleCheck } from 'lucide-angular';

@Component({
  selector: 'app-reserva-exitosa',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './reserva-exitosa.html',
})
export class ReservaExitosaComponent {
  readonly servicioId = input.required<string>();
  readonly nuevaReserva = output<void>();

  protected readonly CircleCheckIcon = CircleCheck;
}
