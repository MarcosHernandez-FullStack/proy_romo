import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, DollarSign, Plus, Pencil, Trash2, Search, Save, X } from 'lucide-angular';
import { ConfiguracionService } from '../../../../core/services/configuracion.service';
import { ClientesService } from '../../../../core/services/clientes.service';
import { ClienteB2B, TarifaCliente } from '../../../../models/clientes.model';
import { ErroresTarifaGlobal, TarifaGlobal } from '../../../../models/configuracion.model';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';
import { MensajeModalComponent } from '../../../../shared/components/mensaje-modal/mensaje-modal';

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ExitoModalComponent, MensajeModalComponent],
  templateUrl: './tarifas.html',
})
export class TarifasComponent implements OnInit {
  private readonly configuracionSvc = inject(ConfiguracionService);
  private readonly clientesSvc      = inject(ClientesService);

  readonly clientes = input.required<ClienteB2B[]>();

  protected readonly DollarSignIcon = DollarSign;
  protected readonly PlusIcon = Plus;
  protected readonly PencilIcon = Pencil;
  protected readonly Trash2Icon = Trash2;
  protected readonly SearchIcon = Search;
  protected readonly SaveIcon = Save;
  protected readonly XIcon = X;

  protected readonly tarifas = signal<TarifaCliente[]>([]);
  protected readonly busqueda = signal('');

  // Modal state
  protected readonly showNueva = signal(false);
  protected readonly tarifaEditar = signal<TarifaCliente | null>(null);

  // Form fields (shared between Nueva and Editar)
  protected readonly formClienteId = signal<number>(0);
  protected readonly formTarifaBase = signal(0);
  protected readonly formTarifaKm = signal(0);
  protected readonly formVigenciaDesde = signal('');
  protected readonly formVigenciaHasta = signal('');
  protected readonly formVigenciaIndefinida = signal(false);

  protected readonly tarifaGlobal = signal<TarifaGlobal | null>(null);
  protected readonly tarifaBaseGlobal = signal(0);
  protected readonly tarifaKmGlobal = signal(0);

  protected readonly guardandoGlobal         = signal(false);
  protected readonly showConfirmGuardar      = signal(false);
  protected readonly showExitoGlobal         = signal(false);
  protected readonly mensajeResultadoGlobal  = signal('');
  protected readonly errorEstadoGlobal       = signal<{ tipo: 'error' | 'advertencia'; titulo: string; mensaje: string } | null>(null);
  protected readonly intentoGuardarGlobal    = signal(false);

  protected readonly erroresGlobal = computed<ErroresTarifaGlobal>(() => {
    const e: ErroresTarifaGlobal = {};
    if (!this.intentoGuardarGlobal()) return e;
    if (this.tarifaBaseGlobal() < 0.01) e.tarifaBaseGlobal = 'Debe ser mayor a 0.';
    if (this.tarifaKmGlobal() < 0.01)   e.tarifaKmGlobal   = 'Debe ser mayor a 0.';
    return e;
  });

  protected readonly tarifasFiltradas = computed(() => {
    const busq = this.busqueda().toLowerCase();
    if (!busq) return this.tarifas();
    return this.tarifas().filter((t) => {
      const c = this.clientes().find((cl) => cl.id === t.clienteId);
      return c ? c.empresa.toLowerCase().includes(busq) || String(c.id).includes(busq) : false;
    });
  });

  ngOnInit(): void {
    this.clientesSvc.getTarifasCliente().subscribe((data) => this.tarifas.set(data));
    this.configuracionSvc.getTarifarioGlobal().subscribe((data) => {
      if (data) {
        this.tarifaGlobal.set(data);
        this.tarifaBaseGlobal.set(data.tarifaBase);
        this.tarifaKmGlobal.set(data.tarifaKm);
      }
    });
  }

  protected getNombreCliente(clienteId: number): string {
    return this.clientes().find((c) => c.id === clienteId)?.empresa ?? String(clienteId);
  }

  protected eliminarTarifa(clienteId: number): void {
    this.tarifas.update((prev) => prev.filter((t) => t.clienteId !== clienteId));
  }

  protected previewCosto(): string {
    const base = this.tarifaBaseGlobal();
    const km = this.tarifaKmGlobal();
    return `Servicio de 10 km = $${base} USD + (10 × $${km} USD) = $${base + 10 * km} USD`;
  }

  protected previewFormCosto(): string {
    const base = this.formTarifaBase();
    const km = this.formTarifaKm();
    return `Servicio de 10 km = $${base} USD + (10 × $${km} USD) = $${base + 10 * km} USD`;
  }

  protected onAbrirNueva(): void {
    this.formClienteId.set(0);
    this.formTarifaBase.set(0);
    this.formTarifaKm.set(0);
    this.formVigenciaDesde.set('');
    this.formVigenciaHasta.set('');
    this.formVigenciaIndefinida.set(false);
    this.showNueva.set(true);
  }

  protected onGuardarNueva(): void {
    const nueva: TarifaCliente = {
      clienteId: this.formClienteId(),
      tarifaBase: this.formTarifaBase(),
      tarifaKm: this.formTarifaKm(),
      vigenciaDesde: this.formVigenciaDesde(),
      vigenciaHasta: this.formVigenciaIndefinida() ? null : this.formVigenciaHasta(),
    };
    this.tarifas.update((prev) => [...prev.filter((t) => t.clienteId !== nueva.clienteId), nueva]);
    this.showNueva.set(false);
  }

  protected onAbrirEditar(t: TarifaCliente): void {
    this.formClienteId.set(t.clienteId);
    this.formTarifaBase.set(t.tarifaBase);
    this.formTarifaKm.set(t.tarifaKm);
    this.formVigenciaDesde.set(t.vigenciaDesde);
    this.formVigenciaHasta.set(t.vigenciaHasta ?? '');
    this.formVigenciaIndefinida.set(t.vigenciaHasta === null);
    this.tarifaEditar.set(t);
  }

  protected onGuardarEditar(): void {
    const updated: TarifaCliente = {
      clienteId: this.formClienteId(),
      tarifaBase: this.formTarifaBase(),
      tarifaKm: this.formTarifaKm(),
      vigenciaDesde: this.formVigenciaDesde(),
      vigenciaHasta: this.formVigenciaIndefinida() ? null : this.formVigenciaHasta(),
    };
    this.tarifas.update((prev) => prev.map((t) => t.clienteId === updated.clienteId ? updated : t));
    this.tarifaEditar.set(null);
  }

  protected get formEsValido(): boolean {
    return this.formClienteId() > 0 && this.formTarifaBase() > 0 && this.formTarifaKm() > 0 && !!this.formVigenciaDesde();
  }

  protected onSolicitarGuardarGlobal(): void {
    this.intentoGuardarGlobal.set(true);
    if (Object.keys(this.erroresGlobal()).length > 0) return;
    this.showConfirmGuardar.set(true);
  }

  protected onConfirmarGuardarGlobal(): void {
    this.showConfirmGuardar.set(false);
    const tarifa = this.tarifaGlobal();
    if (!tarifa || this.guardandoGlobal()) return;

    this.guardandoGlobal.set(true);
    this.configuracionSvc.actualizarTarifarioGlobal(tarifa.id, this.tarifaBaseGlobal(), this.tarifaKmGlobal()).subscribe({
      next: result => {
        this.guardandoGlobal.set(false);
        if (result.exitoso === 1) {
          this.mensajeResultadoGlobal.set(result.mensaje);
          this.showExitoGlobal.set(true);
        } else if (result.exitoso === 2) {
          this.errorEstadoGlobal.set({ tipo: 'advertencia', titulo: 'Tiempo de espera agotado', mensaje: result.mensaje });
        } else {
          this.errorEstadoGlobal.set({ tipo: 'error', titulo: 'Error al Actualizar', mensaje: result.mensaje });
        }
      },
      error: err => {
        this.guardandoGlobal.set(false);
        this.errorEstadoGlobal.set({ tipo: 'error', titulo: 'Error al Actualizar', mensaje: err.error?.mensaje ?? 'Error al actualizar el tarifario.' });
      },
    });
  }
}
