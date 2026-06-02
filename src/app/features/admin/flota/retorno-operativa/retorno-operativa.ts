import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CheckCircle, X, Truck } from 'lucide-angular';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner';
import { ErroresBitacora, UnidadFlota } from '../../../../models/flota.model';
import { FlotaService } from '../../../../core/services/flota.service';

@Component({
  selector: 'app-retorno-operativa',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ErrorBannerComponent],
  templateUrl: './retorno-operativa.html',
})
export class RetornoOperativaComponent {
  private readonly flotaSvc = inject(FlotaService);

  readonly unidad    = input.required<UnidadFlota>();
  readonly confirmar = output<void>();
  readonly cerrar    = output<void>();

  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly XIcon           = X;
  protected readonly TruckIcon       = Truck;

  protected readonly nombreResponsable = signal('');
  protected readonly kilometraje       = signal<number | null>(null);
  protected readonly nota              = signal('');
  protected readonly intentoGuardar    = signal(false);
  protected readonly guardando         = signal(false);
  protected readonly errorMsg          = signal<string | null>(null);

  protected readonly errores = computed<ErroresBitacora>(() => {
    const e: ErroresBitacora = {};
    if (!this.intentoGuardar()) return e;
    if (!this.nombreResponsable().trim())            e.nombreResponsable = 'El nombre del responsable es obligatorio.';
    else if (this.nombreResponsable().length > 50)   e.nombreResponsable = 'Máximo 50 caracteres.';
    const km = this.kilometraje();
    if (km === null || km === 0)                     e.kilometraje       = 'El kilometraje es obligatorio.';
    else if (km < 1 || !Number.isInteger(km))        e.kilometraje       = 'Ingrese un valor entero mayor a 0.';
    if (!this.nota().trim())                         e.nota              = 'La descripción del trabajo realizado es obligatoria.';
    return e;
  });

  protected onConfirmar(): void {
    this.intentoGuardar.set(true);
    if (Object.keys(this.errores()).length > 0 || this.guardando()) return;

    this.errorMsg.set(null);
    this.guardando.set(true);

    this.flotaSvc.retornoOperativa(this.unidad().id, {
      nombreResponsable: this.nombreResponsable().trim(),
      kilometraje:       this.kilometraje()!,
      nota:              this.nota().trim(),
    }).subscribe({
      next: result => {
        this.guardando.set(false);
        if (result.exitoso === 1) {
          this.confirmar.emit();
        } else {
          this.errorMsg.set(result.mensaje || 'Error al registrar el retorno a operativa.');
        }
      },
      error: err => {
        this.guardando.set(false);
        this.errorMsg.set(err?.error?.mensaje ?? 'Error al registrar el retorno a operativa.');
      },
    });
  }
}
