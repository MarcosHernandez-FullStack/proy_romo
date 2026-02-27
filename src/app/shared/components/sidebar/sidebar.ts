import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  Truck,
  ClipboardList,
  LayoutList,
  LogOut,
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.html',
})
export class SidebarComponent {
  protected readonly auth = inject(AuthService);

  protected readonly TruckIcon = Truck;
  protected readonly LogOutIcon = LogOut;

  protected readonly navItems = [
    { label: 'Reservas', path: '/reservas', icon: ClipboardList },
    { label: 'Mis Servicios', path: '/mis-servicios', icon: LayoutList },
  ];
}
