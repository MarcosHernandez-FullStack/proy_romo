import { Component, input } from '@angular/core';
import { LucideAngularModule, AlertTriangle } from 'lucide-angular';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './error-banner.html',
})
export class ErrorBannerComponent {
  readonly mensaje = input.required<string>();
  protected readonly AlertTriangleIcon = AlertTriangle;
}
