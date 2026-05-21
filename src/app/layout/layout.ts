import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, AlertTriangle } from 'lucide-angular';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { ConfiguracionService } from '../core/services/configuracion.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, LucideAngularModule],
  templateUrl: './layout.html',
})
export class LayoutComponent {
  protected readonly configuracionSvc  = inject(ConfiguracionService);
  protected readonly AlertTriangleIcon = AlertTriangle;
}
