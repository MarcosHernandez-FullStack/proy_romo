import { Component, ElementRef, ViewChild, AfterViewInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Building2, MapPin, Navigation, Clock, DollarSign } from 'lucide-angular';
import { ClienteB2B } from '../../../../models/admin.model';

declare var google: any;

interface RutaOptima {
  distanciaKm:    number;
  tiempoMin:      number;
  distanciaTexto: string;
  tiempoTexto:    string;
}

interface TarifaGlobal {
  tarifaBase: number;
  tarifaKm:   number;
}

interface ParametroOperativo {
  tiempoMargenManiobra: number;
  tiempoRetornoBase:    number;
  timerAdministrativo: number;
  timerCliente:        number;
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

  private readonly http = inject(HttpClient);

  constructor() {
    // Auto-calcular ruta
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

    // Cargar tarifario global siempre que haya un cliente seleccionado
    effect(() => {
      const cliente = this.clienteSeleccionado();
      if (!cliente) return;
      if (this.tarifaGlobal() === null) {
        this.http.get<TarifaGlobal>('http://localhost:5016/api/configuracion/tarifario-global')
          .subscribe({ next: t => this.tarifaGlobal.set(t) });
      }
    });

    // Emitir tarifaChange cuando cambie la tarifa efectiva
    effect(() => {
      const t = this.tarifaEfectiva();
      this.tarifaChange.emit(t ? { tarifaKm: t.tarifaKm, tarifaBase: t.tarifaBase } : null);
    });

    // Cargar parámetro operativo al inicializar
    this.http.get<ParametroOperativo>('http://localhost:5016/api/configuracion/parametro-operativo')
      .subscribe({ next: p => { this.parametroOperativo.set(p); this.parametroChange.emit(p); } });
  }

  readonly clientes  = input.required<ClienteB2B[]>();
  readonly clienteId = input.required<string>();
  readonly origen    = input.required<string>();
  readonly destino   = input.required<string>();

  readonly clienteIdChange  = output<string>();
  readonly origenChange     = output<string>();
  readonly destinoChange    = output<string>();
  readonly rutaChange       = output<{ distanciaKm: number; tiempoMin: number; coordLatOrigen: string; coordLonOrigen: string; coordLatDestino: string; coordLonDestino: string } | null>();
  readonly tarifaChange     = output<{ tarifaKm: number; tarifaBase: number } | null>();
  readonly parametroChange  = output<ParametroOperativo | null>();

  protected readonly Building2Icon   = Building2;
  protected readonly MapPinIcon      = MapPin;
  protected readonly NavigationIcon  = Navigation;
  protected readonly ClockIcon       = Clock;
  protected readonly DollarSignIcon  = DollarSign;

  protected readonly clienteSeleccionado = computed(() =>
    this.clientes().find(c => c.id === this.clienteId()) ?? null
  );

  protected readonly cargando            = signal(false);
  protected readonly error               = signal<string | null>(null);
  protected readonly ruta                = signal<RutaOptima | null>(null);
  protected readonly tarifaGlobal        = signal<TarifaGlobal | null>(null);
  protected readonly parametroOperativo  = signal<ParametroOperativo | null>(null);

  // Override de tarifa por cliente: almacena el id del cliente y el tipo elegido
  protected readonly tarifaOverride = signal<{ id: string; tipo: 'personalizada' | 'global' } | null>(null);

  protected readonly clienteTienePersonalizada = computed(() => {
    const c = this.clienteSeleccionado();
    return !!c && (c.tarifaKm ?? 0) + (c.tarifaBase ?? 0) > 0;
  });

  /** Tarifa efectiva: respeta la selección manual del usuario, si no auto-elige */
  protected readonly tarifaEfectiva = computed(() => {
    const cliente = this.clienteSeleccionado();
    if (!cliente) return null;

    const sumaCliente = (cliente.tarifaKm ?? 0) + (cliente.tarifaBase ?? 0);
    const tienePersonalizada = sumaCliente > 0;

    const override = this.tarifaOverride();
    const seleccion = override?.id === cliente.id
      ? override.tipo
      : (tienePersonalizada ? 'personalizada' : 'global');

    if (seleccion === 'personalizada' && tienePersonalizada) {
      return {
        valor:     sumaCliente,
        tipo:      'personalizada' as const,
        tarifaKm:  cliente.tarifaKm  ?? 0,
        tarifaBase: cliente.tarifaBase ?? 0,
      };
    }

    const global = this.tarifaGlobal();
    if (!global) return null;
    const sumaGlobal = (global.tarifaKm ?? 0) + (global.tarifaBase ?? 0);
    return {
      valor:     sumaGlobal,
      tipo:      'global' as const,
      tarifaKm:  global.tarifaKm  ?? 0,
      tarifaBase: global.tarifaBase ?? 0,
    };
  });

  protected seleccionarTarifa(tipo: 'personalizada' | 'global'): void {
    this.tarifaOverride.set({ id: this.clienteId(), tipo });
  }

  protected readonly costoEstimado = computed(() => {
    const r = this.ruta();
    const t = this.tarifaEfectiva();
    if (!r || !t) return null;
    return +(r.distanciaKm * t.valor).toFixed(2);
  });

  protected readonly bloquesOperativos = computed(() => {
    const r = this.ruta();
    if (!r) return null;
    const margen = this.parametroOperativo()?.tiempoMargenManiobra ?? 0;
    return {calculo: Math.ceil((r.tiempoMin + margen) / 60), maniobra: margen};
  });

  protected readonly bloquesArray = computed(() =>
    Array.from({ length: this.bloquesOperativos()?.calculo ?? 0 }, (_, i) => i)
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
      if (place?.formatted_address) this.origenChange.emit(place.formatted_address);
    });

    // Places Autocomplete — destino
    const acDestino = new google.maps.places.Autocomplete(this.destinoInput.nativeElement, {
      types: ['geocode'],
    });
    acDestino.addListener('place_changed', () => {
      const place = acDestino.getPlace();
      if (place?.formatted_address) this.destinoChange.emit(place.formatted_address);
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
          const distanciaKm = +(leg.distance.value / 1000).toFixed(1);
          const tiempoMin   = Math.round(leg.duration.value / 60);

          const coordLatOrigen  = String(leg.start_location.lat());
          const coordLonOrigen  = String(leg.start_location.lng());
          const coordLatDestino = String(leg.end_location.lat());
          const coordLonDestino = String(leg.end_location.lng());

          this.ruta.set({ distanciaKm, tiempoMin, distanciaTexto: leg.distance.text, tiempoTexto: leg.duration.text });
          this.rutaChange.emit({ distanciaKm, tiempoMin, coordLatOrigen, coordLonOrigen, coordLatDestino, coordLonDestino });

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
