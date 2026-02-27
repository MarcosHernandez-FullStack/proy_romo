import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Pencil, X } from 'lucide-angular';
import { UnidadFlota, EstadoUnidad } from '../../../../models/admin.model';

@Component({
  selector: 'app-editar-unidad',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './editar-unidad.html',
})
export class EditarUnidadComponent implements OnInit {
  readonly unidad = input.required<UnidadFlota>();
  readonly guardar = output<UnidadFlota>();
  readonly cerrar = output<void>();

  protected readonly PencilIcon = Pencil;
  protected readonly XIcon = X;

  protected readonly placa = signal('');
  protected readonly anio = signal('');
  protected readonly marca = signal('');
  protected readonly modelo = signal('');
  protected readonly capacidad = signal(1);
  protected readonly vencimientoSeguro = signal('');
  protected readonly estado = signal<EstadoUnidad>('Operativa');

  readonly estados: EstadoUnidad[] = ['Operativa', 'En Taller', 'Baja'];

  protected get esValido(): boolean {
    return !!this.placa() && !!this.marca() && !!this.modelo() && !!this.anio();
  }

  ngOnInit(): void {
    const u = this.unidad();
    this.placa.set(u.placa);
    this.anio.set(String(u.anio));
    this.marca.set(u.marca);
    this.modelo.set(u.modelo);
    this.capacidad.set(u.capacidad);
    this.vencimientoSeguro.set(u.vencimientoSeguro);
    this.estado.set(u.estado);
  }

  protected onGuardar(): void {
    if (!this.esValido) return;
    this.guardar.emit({
      id: this.unidad().id,
      placa: this.placa(),
      marca: this.marca(),
      modelo: this.modelo(),
      anio: Number(this.anio()),
      capacidad: this.capacidad(),
      vencimientoSeguro: this.vencimientoSeguro(),
      estado: this.estado(),
    });
  }
}
