import { Component, input, output } from '@angular/core';
import { LucideAngularModule, CheckCircle, Clock, Lock } from 'lucide-angular';
import { SlotAdmin } from '../../../../models/admin.model';

export interface FechaItem {
  label: string;
  dia: string;
  mes: string;
  date: Date;
}

@Component({
  selector: 'app-seleccion-agenda',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './seleccion-agenda.html',
})
export class SeleccionAgendaComponent {
  readonly fechas = input.required<FechaItem[]>();
  readonly fechaIdx = input.required<number>();
  readonly fechaLabel = input.required<string>();
  readonly slots = input.required<SlotAdmin[]>();
  readonly horarioValidado = input.required<boolean>();
  readonly bloques = input.required<number>();
  readonly selectFecha = output<number>();
  readonly selectSlot = output<number>();
  readonly validar = output<void>();
  readonly editar = output<void>();

  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly ClockIcon = Clock;
  protected readonly LockIcon = Lock;

  protected slotClass(s: SlotAdmin): string {
    switch (s.estado) {
      case 'cerrado': return 'bg-[#d1d5dc] border-[#99a1af] text-[#6a7282] cursor-not-allowed';
      case 'ocupado': return 'bg-[#314158] border-[#1d293d] text-white cursor-not-allowed';
      case 'seleccionado': return 'bg-[#2b7fff] border-[#155dfc] text-white cursor-pointer shadow-md';
      case 'bloqueado': return 'bg-[#d1d5dc] border-[#99a1af] text-[#6a7282] cursor-not-allowed';
      default: return 'bg-white border-[#00c950] text-[#364153] hover:border-[#155dfc] hover:bg-[#eff6ff] cursor-pointer';
    }
  }

  protected slotLabel(s: SlotAdmin): string {
    switch (s.estado) {
      case 'cerrado': return 'Cerrado';
      case 'ocupado': return 'Ocupado';
      case 'seleccionado': return '✓ Inicio';
      case 'bloqueado': return 'Bloq.';
      default: return 'Libre';
    }
  }

  protected slotIconColor(s: SlotAdmin): string {
    switch (s.estado) {
      case 'seleccionado': return 'white';
      case 'ocupado': return 'white';
      case 'libre': return '#00a63e';
      default: return '#9ca3af';
    }
  }

  protected hasSelectedSlot(): boolean {
    return this.slots()?.some(s => s.estado === 'seleccionado') ?? false;
  }

  protected getSelectedSlotHora(): string {
    return this.slots()?.find(s => s.estado === 'seleccionado')?.hora ?? '';
  }

  protected getFinHora(): string {
    const selectedIndex = this.slots().findIndex(s => s.estado === 'seleccionado');
    if (selectedIndex === -1) return '';
    const endH = (selectedIndex + this.bloques()) % 24;
    return `${String(endH).padStart(2, '0')}:00`;
  }

  protected getDateSuffix(): string {
    const f = this.fechas()[this.fechaIdx()];
    return `(${f.dia}/${f.mes})`;
  }
}
