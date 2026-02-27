import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Building2, MapPin, Navigation } from 'lucide-angular';
import { ClienteB2B } from '../../../../models/admin.model';

@Component({
  selector: 'app-seleccion-cliente',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './seleccion-cliente.html',
})
export class SeleccionClienteComponent {
  readonly clientes = input.required<ClienteB2B[]>();
  readonly clienteId = input.required<string>();
  readonly origen = input.required<string>();
  readonly destino = input.required<string>();
  readonly clienteIdChange = output<string>();
  readonly origenChange = output<string>();
  readonly destinoChange = output<string>();

  protected readonly Building2Icon = Building2;
  protected readonly MapPinIcon = MapPin;
  protected readonly NavigationIcon = Navigation;

  protected readonly clienteSeleccionado = computed(() =>
    this.clientes().find((c) => c.id === this.clienteId()) ?? null
  );
}
