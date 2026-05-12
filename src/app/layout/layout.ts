import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, AlertTriangle } from 'lucide-angular';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { ConfigService } from '../core/services/config.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, LucideAngularModule],
  templateUrl: './layout.html',
})
export class LayoutComponent {
  protected readonly configSvc         = inject(ConfigService);
  protected readonly AlertTriangleIcon = AlertTriangle;
}
