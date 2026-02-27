import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, DollarSign, Plus, Pencil, Trash2, Search, Save, X } from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';
import { ClienteB2B, TarifaCliente } from '../../../../models/admin.model';

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './tarifas.html',
})
export class TarifasComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

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
  protected readonly formClienteId = signal('');
  protected readonly formTarifaBase = signal(0);
  protected readonly formTarifaKm = signal(0);
  protected readonly formVigenciaDesde = signal('');
  protected readonly formVigenciaHasta = signal('');
  protected readonly formVigenciaIndefinida = signal(false);

  // Tarifa global
  protected readonly tarifaBaseGlobal = signal(150);
  protected readonly tarifaKmGlobal = signal(50);

  protected readonly tarifasFiltradas = computed(() => {
    const busq = this.busqueda().toLowerCase();
    if (!busq) return this.tarifas();
    return this.tarifas().filter((t) => {
      const c = this.clientes().find((cl) => cl.id === t.clienteId);
      return c ? c.empresa.toLowerCase().includes(busq) || c.id.toLowerCase().includes(busq) : false;
    });
  });

  ngOnInit(): void {
    this.adminSvc.getTarifasCliente().subscribe((data) => this.tarifas.set(data));
  }

  protected getNombreCliente(clienteId: string): string {
    return this.clientes().find((c) => c.id === clienteId)?.empresa ?? clienteId;
  }

  protected eliminarTarifa(clienteId: string): void {
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
    this.formClienteId.set('');
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
    return !!this.formClienteId() && this.formTarifaBase() > 0 && this.formTarifaKm() > 0 && !!this.formVigenciaDesde();
  }
}
