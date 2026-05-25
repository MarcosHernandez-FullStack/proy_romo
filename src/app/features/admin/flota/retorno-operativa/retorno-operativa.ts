import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CheckCircle, X, Truck, AlertTriangle } from 'lucide-angular';
import { UnidadFlota } from '../../../../models/flota.model';
import { FlotaService } from '../../../../core/services/flota.service';

@Component({
  selector: 'app-retorno-operativa',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './retorno-operativa.html',
})
export class RetornoOperativaComponent {
  private readonly flotaSvc = inject(FlotaService);

  readonly unidad    = input.required<UnidadFlota>();
  readonly confirmar = output<void>();
  readonly cerrar    = output<void>();

  protected readonly CheckCircleIcon   = CheckCircle;
  protected readonly XIcon             = X;
  protected readonly TruckIcon         = Truck;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly nombreResponsable = signal('');
  protected readonly kilometraje       = signal<number | null>(null);
  protected readonly nota              = signal('');
  protected readonly mostrarErrores    = signal(false);
  protected readonly guardando         = signal(false);
  protected readonly errorMsg          = signal<string | null>(null);

  protected get errorNombreResponsable(): string {
    if (!this.nombreResponsable().trim()) return 'El nombre del responsable es obligatorio.';
    if (this.nombreResponsable().length > 50) return 'Máximo 50 caracteres.';
    return '';
  }

  protected get errorKilometraje(): string {
    const km = this.kilometraje();
    if (km === null || km === 0) return 'El kilometraje es obligatorio.';
    if (km < 1 || !Number.isInteger(km)) return 'Ingrese un valor entero mayor a 0.';
    return '';
  }

  protected get errorNota(): string {
    if (!this.nota().trim()) return 'La descripción del trabajo realizado es obligatoria.';
    return '';
  }

  protected get esValido(): boolean {
    return !this.errorNombreResponsable && !this.errorKilometraje && !this.errorNota;
  }

  protected onConfirmar(): void {
    this.mostrarErrores.set(true);
    if (!this.esValido || this.guardando()) return;

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
