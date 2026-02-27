import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, AlertTriangle, Info, Save } from 'lucide-angular';
import { HorarioRegular } from '../../../../models/admin.model';

@Component({
  selector: 'app-horarios-regulares',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './horarios-regulares.html',
})
export class HorariosRegularesComponent implements OnInit {
  readonly horarios = input.required<HorarioRegular[]>();
  readonly guardar = output<HorarioRegular[]>();

  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly InfoIcon = Info;
  protected readonly SaveIcon = Save;

  protected readonly editados = signal<HorarioRegular[]>([]);

  ngOnInit(): void {
    this.editados.set(this.horarios().map((h) => ({ ...h })));
  }

  protected horarioClienteLabel(h: HorarioRegular): string {
    return h.activo ? `${h.abre} – ${h.cierra}` : 'No disponible';
  }

  protected toggleActivo(idx: number): void {
    this.editados.update((arr) =>
      arr.map((h, i) => (i === idx ? { ...h, activo: !h.activo } : h))
    );
  }

  protected updateAbre(idx: number, val: string): void {
    this.editados.update((arr) =>
      arr.map((h, i) => (i === idx ? { ...h, abre: val } : h))
    );
  }

  protected updateCierra(idx: number, val: string): void {
    this.editados.update((arr) =>
      arr.map((h, i) => (i === idx ? { ...h, cierra: val } : h))
    );
  }

  protected onGuardar(): void {
    this.guardar.emit(this.editados());
  }
}
