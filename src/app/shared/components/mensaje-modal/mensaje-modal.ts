import { Component, input, output } from '@angular/core';
import { LucideAngularModule, CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-angular';

export type MensajeModalTipo = 'exito' | 'error' | 'advertencia' | 'info';

@Component({
  selector: 'app-mensaje-modal',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './mensaje-modal.html',
})
export class MensajeModalComponent {
  readonly tipo    = input.required<MensajeModalTipo>();
  readonly titulo  = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly cerrar  = output<void>();

  protected readonly CheckCircleIcon   = CheckCircle;
  protected readonly XCircleIcon       = XCircle;
  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly InfoIcon          = Info;
  protected readonly XIcon             = X;

  protected get iconColor(): string {
    switch (this.tipo()) {
      case 'exito':      return '#008236';
      case 'error':      return '#b91c1c';
      case 'advertencia': return '#b45309';
      default:           return '#1447e6';
    }
  }

  protected get headerClass(): string {
    switch (this.tipo()) {
      case 'exito':      return 'bg-[#f0fdf4] border-b border-[#7bf1a8]';
      case 'error':      return 'bg-[#fff1f1] border-b border-[#fca5a5]';
      case 'advertencia': return 'bg-[#fffbeb] border-b border-[#fcd34d]';
      default:           return 'bg-[#eff6ff] border-b border-[#bedbff]';
    }
  }

  protected get iconBgClass(): string {
    switch (this.tipo()) {
      case 'exito':      return 'bg-[#dcfce7] border border-[#7bf1a8]';
      case 'error':      return 'bg-[#fee2e2] border border-[#fca5a5]';
      case 'advertencia': return 'bg-[#fef3c7] border border-[#fcd34d]';
      default:           return 'bg-[#dbeafe] border border-[#bedbff]';
    }
  }

  protected get btnClass(): string {
    switch (this.tipo()) {
      case 'exito':      return 'bg-[#008236] hover:bg-[#006b2c] text-white';
      case 'error':      return 'bg-[#b91c1c] hover:bg-[#991b1b] text-white';
      case 'advertencia': return 'bg-[#b45309] hover:bg-[#92400e] text-white';
      default:           return 'bg-[#155dfc] hover:bg-[#1447e6] text-white';
    }
  }
}
