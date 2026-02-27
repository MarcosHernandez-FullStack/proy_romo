import { Component } from '@angular/core';
import { LucideAngularModule, AlertCircle, FileWarning, Wrench } from 'lucide-angular';

@Component({
  selector: 'app-alertas-sistema',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './alertas-sistema.html',
})
export class AlertasSistemaComponent {
  protected readonly AlertCircleIcon = AlertCircle;
  protected readonly FileWarningIcon = FileWarning;
  protected readonly WrenchIcon = Wrench;
}
