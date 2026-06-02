import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Pencil, X } from 'lucide-angular';
import { FlotaService } from '../../../../core/services/flota.service';
import { ErroresUnidad, UnidadFlota } from '../../../../models/flota.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner';

@Component({
  selector: 'app-editar-unidad',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent, ErrorBannerComponent],
  templateUrl: './editar-unidad.html',
})
export class EditarUnidadComponent implements OnInit {
  private readonly flotaSvc = inject(FlotaService);

  readonly unidad = input.required<UnidadFlota>();
  readonly guardar = output<void>();
  readonly cerrar  = output<void>();

  protected readonly PencilIcon = Pencil;
  protected readonly XIcon      = X;

  protected readonly placa             = signal('');
  protected readonly anio              = signal('');
  protected readonly marca             = signal('');
  protected readonly modelo            = signal('');
  protected readonly capacidad         = signal(1);
  protected readonly vencimientoSeguro = signal('');

  protected readonly guardando      = signal(false);
  protected readonly errorMsg       = signal('');
  protected readonly showExito      = signal(false);
  protected readonly intentoGuardar = signal(false);

  private readonly anioActual = new Date().getFullYear();

  ngOnInit(): void {
    const u = this.unidad();
    this.placa.set(u.placa);
    this.anio.set(String(u.anioFabricacion));
    this.marca.set(u.marca);
    this.modelo.set(u.modelo);
    this.capacidad.set(u.capacidad);
    this.vencimientoSeguro.set(this.toIso(u.fecVenSeg));
  }

  private toIso(fec: string | null): string {
    if (!fec) return '';
    const parts = fec.split('/');
    if (parts.length !== 3) return fec;
    const [d, m, y] = parts;
    return `${y}-${m}-${d}`;
  }

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

    this.flotaSvc.editarGrua(this.unidad().id, {
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
          this.showExito.set(true);
        } else {
          this.errorMsg.set(result.mensaje || 'Error al actualizar la unidad.');
        }
      },
      error: err => {
        this.guardando.set(false);
        this.errorMsg.set(err?.error?.mensaje ?? 'Error al actualizar la unidad.');
      },
    });
  }
}
