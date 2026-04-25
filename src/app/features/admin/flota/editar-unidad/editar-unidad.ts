import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Pencil, X, AlertTriangle } from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';
import { UnidadFlota } from '../../../../models/admin.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';

@Component({
  selector: 'app-editar-unidad',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent],
  templateUrl: './editar-unidad.html',
})
export class EditarUnidadComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  readonly unidad = input.required<UnidadFlota>();
  readonly guardar = output<void>();
  readonly cerrar  = output<void>();

  protected readonly PencilIcon        = Pencil;
  protected readonly XIcon             = X;
  protected readonly AlertTriangleIcon = AlertTriangle;

  protected readonly placa             = signal('');
  protected readonly anio              = signal('');
  protected readonly marca             = signal('');
  protected readonly modelo            = signal('');
  protected readonly capacidad         = signal(1);
  protected readonly vencimientoSeguro = signal('');

  protected readonly guardando = signal(false);
  protected readonly errorMsg  = signal('');
  protected readonly showExito = signal(false);

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
  }

  protected onGuardar(): void {
    if (!this.esValido || this.guardando()) return;

    this.errorMsg.set('');
    this.guardando.set(true);

    const idNumerico = parseInt(this.unidad().id.split('-')[1], 10);

    this.adminSvc.editarGrua(idNumerico, {
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
