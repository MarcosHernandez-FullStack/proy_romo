import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, AlertTriangle, Info, Save, Loader } from 'lucide-angular';
import { HORAS_GRID, HorarioRegular } from '../../../../models/agenda.model';

@Component({
  selector: 'app-horarios-regulares',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './horarios-regulares.html',
})
export class HorariosRegularesComponent implements OnInit {
  readonly horarios  = input.required<HorarioRegular[]>();
  readonly guardando = input<boolean>(false);
  readonly guardar   = output<HorarioRegular[]>();

  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly InfoIcon          = Info;
  protected readonly SaveIcon          = Save;
  protected readonly LoaderIcon        = Loader;

  protected readonly horas    = HORAS_GRID;
  protected readonly editados = signal<HorarioRegular[]>([]);

  ngOnInit(): void {
    this.editados.set(this.horarios().map((h) => ({ ...h })));
  }

  protected horarioClienteLabel(h: HorarioRegular): string {
    return h.estado === 'ACTIVO' ? `${h.horaInicio} – ${h.horaFinal}` : 'No disponible';
  }

  protected toggleActivo(idx: number): void {
    this.editados.update((arr) =>
      arr.map((h, i) => (i === idx ? { ...h, estado: h.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' } : h))
    );
  }

  protected updateHoraInicio(idx: number, val: string): void {
    this.editados.update((arr) =>
      arr.map((h, i) => (i === idx ? { ...h, horaInicio: val } : h))
    );
  }

  protected updateHoraFinal(idx: number, val: string): void {
    this.editados.update((arr) =>
      arr.map((h, i) => (i === idx ? { ...h, horaFinal: val } : h))
    );
  }

  protected onGuardar(): void {
    this.guardar.emit(this.editados());
  }
}
