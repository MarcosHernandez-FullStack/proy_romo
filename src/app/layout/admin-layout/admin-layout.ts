import { Component, signal, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, Menu } from 'lucide-angular';
import { AdminSidebarComponent } from '../../shared/components/admin-sidebar/admin-sidebar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, LucideAngularModule],
  templateUrl: './admin-layout.html',
})
export class AdminLayoutComponent {
  protected readonly MenuIcon = Menu;
  protected readonly sidebarAbierta = signal(false);

  protected readonly sidebarClass = computed(() =>
    this.sidebarAbierta()
      ? 'fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300 translate-x-0'
      : 'fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300 -translate-x-full md:translate-x-0'
  );
}
