import { Component, ElementRef, ViewChild, AfterViewInit, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Building2, MapPin, Navigation, Clock } from 'lucide-angular';
import { ClienteB2B } from '../../../../models/admin.model';

declare var google: any;

interface RutaOptima {
  distanciaKm:    number;
  tiempoMin:      number;
  distanciaTexto: string;
  tiempoTexto:    string;
}

@Component({
  selector: 'app-seleccion-cliente',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './seleccion-cliente.html',
})
export class SeleccionClienteComponent implements AfterViewInit {
  @ViewChild('mapContainer')  mapContainer!:  ElementRef<HTMLDivElement>;
  @ViewChild('origenInput')   origenInput!:   ElementRef<HTMLInputElement>;
  @ViewChild('destinoInput')  destinoInput!:  ElementRef<HTMLInputElement>;

  constructor() {
    let timer: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
      const o = this.origen().trim();
      const d = this.destino().trim();
      if (timer) { clearTimeout(timer); timer = null; }
      if (o && d) {
        timer = setTimeout(() => this.calcularRuta(), 800);
      } else {
        this.ruta.set(null);
        this.error.set(null);
        this.rutaChange.emit(null);
      }
    });
  }

  readonly clientes  = input.required<ClienteB2B[]>();
  readonly clienteId = input.required<string>();
  readonly origen    = input.required<string>();
  readonly destino   = input.required<string>();

  readonly clienteIdChange = output<string>();
  readonly origenChange    = output<string>();
  readonly destinoChange   = output<string>();
  readonly rutaChange      = output<{ distanciaKm: number; tiempoMin: number } | null>();

  protected readonly Building2Icon  = Building2;
  protected readonly MapPinIcon     = MapPin;
  protected readonly NavigationIcon = Navigation;
  protected readonly ClockIcon      = Clock;

  protected readonly clienteSeleccionado = computed(() =>
    this.clientes().find(c => c.id === this.clienteId()) ?? null
  );

  protected readonly cargando = signal(false);
  protected readonly error    = signal<string | null>(null);
  protected readonly ruta     = signal<RutaOptima | null>(null);

  protected readonly costoEstimado = computed(() => {
    const r = this.ruta();
    if (!r) return null;
    const tarifa = this.clienteSeleccionado()?.tarifaKm ?? 0;
    return +(r.distanciaKm * tarifa).toFixed(0);
  });

  protected readonly bloquesOperativos = computed(() => {
    const r = this.ruta();
    return r ? Math.ceil(r.tiempoMin / 60) : null;
  });

  protected readonly bloquesArray = computed(() =>
    Array.from({ length: this.bloquesOperativos() ?? 0 }, (_, i) => i)
  );

  private directionsService!: any;
  private map!:               any;
  private renderer:           any = null;

  ngAfterViewInit(): void {
    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: { lat: -8.1116, lng: -79.0287 },
      zoom: 12,
    });
    this.directionsService = new google.maps.DirectionsService();

    // Places Autocomplete — origen
    const acOrigen = new google.maps.places.Autocomplete(this.origenInput.nativeElement, {
      types: ['geocode'],
    });
    acOrigen.addListener('place_changed', () => {
      const place = acOrigen.getPlace();
      if (place?.formatted_address) {
        this.origenChange.emit(place.formatted_address);
      }
    });

    // Places Autocomplete — destino
    const acDestino = new google.maps.places.Autocomplete(this.destinoInput.nativeElement, {
      types: ['geocode'],
    });
    acDestino.addListener('place_changed', () => {
      const place = acDestino.getPlace();
      if (place?.formatted_address) {
        this.destinoChange.emit(place.formatted_address);
      }
    });
  }

  protected calcularRuta(): void {
    const origen  = this.origen().trim();
    const destino = this.destino().trim();
    if (!origen || !destino) return;

    this.cargando.set(true);
    this.error.set(null);
    this.ruta.set(null);
    if (this.renderer) { this.renderer.setMap(null); this.renderer = null; }

    this.directionsService.route(
      {
        origin: origen,
        destination: destino,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      },
      (result: any, status: any) => {
        this.cargando.set(false);
        if (status === 'OK') {
          const leg         = result.routes[0].legs[0];
          const distanciaKm = Math.round(leg.distance.value / 1000);
          const tiempoMin   = Math.round(leg.duration.value / 60);

          this.ruta.set({
            distanciaKm,
            tiempoMin,
            distanciaTexto: leg.distance.text,
            tiempoTexto:    leg.duration.text,
          });
          this.rutaChange.emit({ distanciaKm, tiempoMin });

          this.renderer = new google.maps.DirectionsRenderer({
            map: this.map,
            polylineOptions: { strokeColor: '#155dfc', strokeOpacity: 1, strokeWeight: 5 },
          });
          this.renderer.setDirections(result);
        } else {
          this.error.set('No se pudo calcular la ruta. Verifique las direcciones.');
          this.rutaChange.emit(null);
        }
      }
    );
  }
}
