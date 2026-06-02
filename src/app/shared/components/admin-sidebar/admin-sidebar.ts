import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  CalendarDays,
  Phone,
  Truck,
  Building2,
  Users,
  Wrench,
  UserCog,
  Settings,
  ChartBar,
  LogOut,
  Shield,
  GanttChart,
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './admin-sidebar.html',
})
export class AdminSidebarComponent {
  protected readonly authSvc = inject(AuthService);

  protected readonly ShieldIcon   = Shield;
  protected readonly LogOutIcon   = LogOut;

  protected readonly navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Agenda Maestra', path: '/admin/agenda-maestra', icon: CalendarDays },
    { label: 'Nueva Reserva', path: '/admin/nueva-reserva', icon: Phone },
    { label: 'Operaciones',          path: '/admin/operaciones',          icon: Truck },
    { label: 'Disponibilidad Grúas', path: '/admin/disponibilidad-gruas', icon: GanttChart },
    { label: 'Clientes B2B', path: '/admin/clientes', icon: Building2 },
    { label: 'Operadores', path: '/admin/operadores', icon: Users },
    { label: 'Unidades (Flota)', path: '/admin/flota', icon: Wrench },
    { label: 'Usuarios', path: '/admin/usuarios', icon: UserCog },
    { label: 'Configuración', path: '/admin/configuracion', icon: Settings },
    { label: 'Cobranzas', path: '/admin/reportes', icon: ChartBar },
  ];
}
