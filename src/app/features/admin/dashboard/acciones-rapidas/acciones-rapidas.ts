import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Globe,
  AlertTriangle,
  Calendar,
  Wrench,
  UserCog,
  ChevronRight,
} from 'lucide-angular';

@Component({
  selector: 'app-acciones-rapidas',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './acciones-rapidas.html',
})
export class AccionesRapidasComponent {
  readonly motorActivo = input.required<boolean>();
  readonly toggleMotor = output<void>();

  protected readonly GlobeIcon = Globe;
  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly CalendarIcon = Calendar;
  protected readonly WrenchIcon = Wrench;
  protected readonly UserCogIcon = UserCog;
  protected readonly ChevronRightIcon = ChevronRight;
}
