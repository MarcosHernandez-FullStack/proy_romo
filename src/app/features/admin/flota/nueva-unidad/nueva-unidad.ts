import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Truck, X, AlertTriangle } from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';

@Component({
  selector: 'app-nueva-unidad',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent],
  templateUrl: './nueva-unidad.html',
})
export class NuevaUnidadComponent {
  private readonly adminSvc = inject(AdminService);

  readonly guardar = output<void>();
  readonly cerrar  = output<void>();

  protected readonly TruckIcon         = Truck;
  protected readonly XIcon             = X;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly placa              = signal('');
  protected readonly anio               = signal('');
  protected readonly marca              = signal('');
  protected readonly modelo             = signal('');
  protected readonly capacidad          = signal(1);
  protected readonly vencimientoSeguro  = signal('');

  protected readonly guardando = signal(false);
  protected readonly errorMsg  = signal('');
  protected readonly showExito = signal(false);
  protected readonly idNuevo   = signal(0);

  protected get idNuevoFormato(): string {
    return `GRU-${String(this.idNuevo()).padStart(3, '0')}`;
  }

  protected get esValido(): boolean {
    return !!this.placa() && !!this.marca() && !!this.modelo() && !!this.anio();
  }

  protected onGuardar(): void {
    if (!this.esValido || this.guardando()) return;

    this.errorMsg.set('');
    this.guardando.set(true);

    this.adminSvc.crearGrua({
      placa:          this.placa(),
      marca:          this.marca(),
      modelo:         this.modelo(),
      añoFabricacion: Number(this.anio()),
      capacidad:      this.capacidad(),
      fecVenSeg:      this.vencimientoSeguro(),
    }).subscribe({
      next: result => {
        this.guardando.set(false);
        if (result.exitoso === 1) {
          this.idNuevo.set(result.idNuevo ?? 0);
          this.showExito.set(true);
        } else {
          this.errorMsg.set(result.mensaje || 'Error al registrar la unidad.');
        }
      },
      error: err => {
        this.guardando.set(false);
        this.errorMsg.set(err?.error?.mensaje ?? 'Error al registrar la unidad.');
      },
    });
  }
}
