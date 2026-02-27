import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { adminAuthGuard } from './core/guards/admin-auth.guard';
import { noAdminAuthGuard } from './core/guards/no-admin-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/cliente/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'reservas',
        loadComponent: () => import('./features/cliente/reserva/reserva').then((m) => m.ReservaComponent),
      },
      {
        path: 'mis-servicios',
        loadComponent: () =>
          import('./features/cliente/mis-servicios/mis-servicios').then((m) => m.MisServiciosComponent),
      },
      { path: '', redirectTo: 'reservas', pathMatch: 'full' },
    ],
  },
  // Admin routes
  {
    path: 'admin/login',
    canActivate: [noAdminAuthGuard],
    loadComponent: () =>
      import('./features/admin/login-admin/login-admin').then((m) => m.LoginAdminComponent),
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminAuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'agenda-maestra',
        loadComponent: () =>
          import('./features/admin/agenda-maestra/agenda-maestra').then((m) => m.AgendaMaestraComponent),
      },
      {
        path: 'nueva-reserva',
        loadComponent: () =>
          import('./features/admin/nueva-reserva/nueva-reserva').then((m) => m.NuevaReservaComponent),
      },
      {
        path: 'operaciones',
        loadComponent: () =>
          import('./features/admin/operaciones/operaciones').then((m) => m.OperacionesComponent),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/admin/clientes/clientes').then((m) => m.ClientesComponent),
      },
      {
        path: 'operadores',
        loadComponent: () =>
          import('./features/admin/operadores/operadores').then((m) => m.OperadoresComponent),
      },
      {
        path: 'flota',
        loadComponent: () =>
          import('./features/admin/flota/flota').then((m) => m.FlotaComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/usuarios/usuarios').then((m) => m.UsuariosComponent),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/admin/configuracion/configuracion').then((m) => m.ConfiguracionComponent),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/admin/reportes/reportes').then((m) => m.ReportesComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
