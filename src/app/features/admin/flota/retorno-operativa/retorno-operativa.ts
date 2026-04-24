import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CheckCircle, X, Truck } from 'lucide-angular';
import { UnidadFlota } from '../../../../models/admin.model';

export interface RetornoData {
  kilometraje: number;
  nota: string;
}

@Component({
  selector: 'app-retorno-operativa',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './retorno-operativa.html',
})
export class RetornoOperativaComponent {
  readonly unidad = input.required<UnidadFlota>();
  readonly confirmar = output<RetornoData>();
  readonly cerrar = output<void>();

  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly XIcon = X;
  protected readonly TruckIcon = Truck;

  protected readonly kilometraje = signal<number | null>(null);
  protected readonly nota = signal('');

  protected get esValido(): boolean {
    const km = this.kilometraje();
    return km !== null && km > 0 && this.nota().trim().length > 0;
  }

  protected onConfirmar(): void {
    if (!this.esValido) return;
    this.confirmar.emit({ kilometraje: this.kilometraje()!, nota: this.nota().trim() });
  }
}
