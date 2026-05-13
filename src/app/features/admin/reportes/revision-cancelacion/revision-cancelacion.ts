import { Component, input, output } from '@angular/core';
import { LucideAngularModule, XCircle } from 'lucide-angular';
import { ServicioReporte } from '../../../../models/admin.model';

@Component({
  selector: 'app-revision-cancelacion',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './revision-cancelacion.html',
})
export class RevisionCancelacionComponent {
  readonly servicio = input.required<ServicioReporte>();
  readonly cerrar   = output<void>();

  protected readonly XCircleIcon = XCircle;

  protected formatFecha(f: string): string {
    const s = f.includes('T') ? f.split('T')[0] : f;
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }
}
