import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { LucideAngularModule, DollarSign, Clock, TrendingDown, AlertTriangle } from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { BalanceOperativoComponent } from './balance-operativo/balance-operativo';
import { AlertasSistemaComponent } from './alertas-sistema/alertas-sistema';
import { AccionesRapidasComponent } from './acciones-rapidas/acciones-rapidas';
import { ProximosHitosComponent, ProximoHito } from './proximos-hitos/proximos-hitos';
import { Operador } from '../../../models/admin.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    LucideAngularModule,
    BalanceOperativoComponent,
    AlertasSistemaComponent,
    AccionesRapidasComponent,
    ProximosHitosComponent,
  ],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly DollarSignIcon = DollarSign;
  protected readonly ClockIcon = Clock;
  protected readonly TrendingDownIcon = TrendingDown;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly operadores = signal<Operador[]>([]);
  protected readonly motorActivo = signal(true);

  protected readonly operadoresDisponibles = computed(
    () => this.operadores().filter((o) => o.activo).length
  );

  protected readonly today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  protected readonly proximosHitos: ProximoHito[] = [
    { hora: '14:30', id: 'SRV-127', placa: 'ABC-123', operador: 'Roberto Sánchez', cliente: 'Transportes XYZ S.A.', critico: false },
    { hora: '15:00', id: 'SRV-128', placa: 'DEF-456', operador: null, cliente: 'Logística Beta Ltda.', critico: true },
    { hora: '16:15', id: 'SRV-129', placa: 'GHI-789', operador: 'Fernando López', cliente: 'Distribuidora Central', critico: false },
  ];

  ngOnInit(): void {
    this.adminSvc.getOperadores().subscribe((data) => this.operadores.set(data));
  }
}
