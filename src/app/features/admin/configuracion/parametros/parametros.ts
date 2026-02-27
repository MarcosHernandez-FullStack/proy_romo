import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Save, Info, SlidersHorizontal } from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-parametros',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './parametros.html',
})
export class ParametrosComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly SaveIcon = Save;
  protected readonly InfoIcon = Info;
  protected readonly SlidersIcon = SlidersHorizontal;

  protected readonly umbralLargaDistanciaKm = signal(15);
  protected readonly margenManiobraMin = signal(30);
  protected readonly umbralToleranciaMin = signal(5);
  protected readonly tiempoRetornoBaseMin = signal(20);

  ngOnInit(): void {
    this.adminSvc.getParametrosOperativos().subscribe((p) => {
      this.umbralLargaDistanciaKm.set(p.umbralLargaDistanciaKm);
      this.margenManiobraMin.set(p.margenManiobraMin);
      this.umbralToleranciaMin.set(p.umbralToleranciaMin);
      this.tiempoRetornoBaseMin.set(p.tiempoRetornoBaseMin);
    });
  }
}
