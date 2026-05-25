import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Truck, X, AlertTriangle } from 'lucide-angular';
import { FlotaService } from '../../../../core/services/flota.service';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';

@Component({
  selector: 'app-nueva-unidad',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent],
  templateUrl: './nueva-unidad.html',
})
export class NuevaUnidadComponent {
  private readonly flotaSvc = inject(FlotaService);

  readonly guardar = output<void>();
  readonly cerrar  = output<void>();

  protected readonly TruckIcon         = Truck;
  protected readonly XIcon             = X;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly placa             = signal('');
  protected readonly anio              = signal('');
  protected readonly marca             = signal('');
  protected readonly modelo            = signal('');
  protected readonly capacidad         = signal(1);
  protected readonly vencimientoSeguro = signal('');

  protected readonly guardando      = signal(false);
  protected readonly errorMsg       = signal('');
  protected readonly showExito      = signal(false);
  protected readonly idNuevo        = signal(0);
  protected readonly mostrarErrores = signal(false);

  protected get idNuevoFormato(): string {
    return `GRU-${String(this.idNuevo()).padStart(3, '0')}`;
  }

  private readonly anioActual = new Date().getFullYear();

  // ── Validaciones por campo ────────────────────────────────
  protected get errorPlaca(): string {
    if (!this.placa().trim()) return 'La placa es obligatoria.';
    if (this.placa().length > 10) return 'Máximo 10 caracteres.';
    return '';
  }

  protected get errorMarca(): string {
    if (!this.marca().trim()) return 'La marca es obligatoria.';
    if (this.marca().length > 30) return 'Máximo 30 caracteres.';
    return '';
  }

  protected get errorModelo(): string {
    if (!this.modelo().trim()) return 'El modelo es obligatorio.';
    if (this.modelo().length > 30) return 'Máximo 30 caracteres.';
    return '';
  }

  protected get errorAnio(): string {
    if (!this.anio()) return 'El año de fabricación es obligatorio.';
    const n = Number(this.anio());
    if (!Number.isInteger(n) || n < 1900 || n > this.anioActual) return `Ingrese un año entre 1900 y ${this.anioActual}.`;
    return '';
  }

  protected get errorCapacidad(): string {
    if (this.capacidad() < 1) return 'La capacidad mínima es 1.';
    return '';
  }

  protected get errorVencimiento(): string {
    if (!this.vencimientoSeguro()) return 'La fecha de vencimiento del seguro es obligatoria.';
    return '';
  }

  protected get esValido(): boolean {
    return !this.errorPlaca && !this.errorMarca && !this.errorModelo &&
           !this.errorAnio && !this.errorCapacidad && !this.errorVencimiento;
  }

  protected onGuardar(): void {
    this.mostrarErrores.set(true);
    if (!this.esValido || this.guardando()) return;

    this.errorMsg.set('');
    this.guardando.set(true);

    this.flotaSvc.crearGrua({
      placa:          this.placa(),
      marca:          this.marca(),
      modelo:         this.modelo(),
      anioFabricacion: Number(this.anio()),
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
