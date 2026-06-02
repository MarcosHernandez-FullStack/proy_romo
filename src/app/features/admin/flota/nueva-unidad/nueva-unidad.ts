import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Truck, X } from 'lucide-angular';
import { FlotaService } from '../../../../core/services/flota.service';
import { ErroresUnidad } from '../../../../models/flota.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner';

@Component({
  selector: 'app-nueva-unidad',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent, ErrorBannerComponent],
  templateUrl: './nueva-unidad.html',
})
export class NuevaUnidadComponent {
  private readonly flotaSvc = inject(FlotaService);

  readonly guardar = output<void>();
  readonly cerrar  = output<void>();

  protected readonly TruckIcon = Truck;
  protected readonly XIcon     = X;

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
  protected readonly intentoGuardar = signal(false);

  protected get idNuevoFormato(): string {
    return `GRU-${String(this.idNuevo()).padStart(3, '0')}`;
  }

  private readonly anioActual = new Date().getFullYear();

  protected readonly errores = computed<ErroresUnidad>(() => {
    const e: ErroresUnidad = {};
    if (!this.intentoGuardar()) return e;
    if (!this.placa().trim())              e.placa             = 'La placa es obligatoria.';
    else if (this.placa().length > 10)     e.placa             = 'Máximo 10 caracteres.';
    if (!this.marca().trim())              e.marca             = 'La marca es obligatoria.';
    else if (this.marca().length > 30)     e.marca             = 'Máximo 30 caracteres.';
    if (!this.modelo().trim())             e.modelo            = 'El modelo es obligatorio.';
    else if (this.modelo().length > 30)    e.modelo            = 'Máximo 30 caracteres.';
    if (!this.anio()) {
      e.anio = 'El año de fabricación es obligatorio.';
    } else {
      const n = Number(this.anio());
      if (!Number.isInteger(n) || n < 1900 || n > this.anioActual)
        e.anio = `Ingrese un año entre 1900 y ${this.anioActual}.`;
    }
    if (this.capacidad() < 1)             e.capacidad         = 'La capacidad mínima es 1.';
    if (!this.vencimientoSeguro())        e.vencimientoSeguro = 'La fecha de vencimiento del seguro es obligatoria.';
    return e;
  });

  protected onGuardar(): void {
    this.intentoGuardar.set(true);
    if (Object.keys(this.errores()).length > 0 || this.guardando()) return;

    this.errorMsg.set('');
    this.guardando.set(true);

    this.flotaSvc.crearGrua({
      placa:           this.placa(),
      marca:           this.marca(),
      modelo:          this.modelo(),
      anioFabricacion: Number(this.anio()),
      capacidad:       this.capacidad(),
      fecVenSeg:       this.vencimientoSeguro(),
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
