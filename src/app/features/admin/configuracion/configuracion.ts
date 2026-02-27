import { Component, OnInit, inject, signal } from '@angular/core';
import { LucideAngularModule, DollarSign, SlidersHorizontal, Settings } from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { ClienteB2B } from '../../../models/admin.model';
import { TarifasComponent } from './tarifas/tarifas';
import { ParametrosComponent } from './parametros/parametros';

type TabConfig = 'tarifas' | 'parametros';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [LucideAngularModule, TarifasComponent, ParametrosComponent],
  templateUrl: './configuracion.html',
})
export class ConfiguracionComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly SettingsIcon = Settings;
  protected readonly DollarSignIcon = DollarSign;
  protected readonly SlidersIcon = SlidersHorizontal;

  protected readonly tab = signal<TabConfig>('tarifas');
  protected readonly clientes = signal<ClienteB2B[]>([]);

  ngOnInit(): void {
    this.adminSvc.getClientes().subscribe((data) => this.clientes.set(data));
  }
}
