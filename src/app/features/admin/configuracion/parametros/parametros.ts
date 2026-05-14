import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Save, Info, Clock, Timer, Route, Navigation, MapPin } from 'lucide-angular';
import { AdminService } from '../../../../core/services/admin.service';
import { MensajeModalComponent } from '../../../../shared/components/mensaje-modal/mensaje-modal';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';

@Component({
  selector: 'app-parametros',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MensajeModalComponent, ExitoModalComponent],
  templateUrl: './parametros.html',
})
export class ParametrosComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly SaveIcon       = Save;
  protected readonly InfoIcon       = Info;
  protected readonly ClockIcon      = Clock;
  protected readonly TimerIcon      = Timer;
  protected readonly RouteIcon      = Route;
  protected readonly NavigationIcon = Navigation;
  protected readonly MapPinIcon     = MapPin;

  // Sección 1: Horario operativo
  protected readonly zonaHoraria = signal('');
  protected readonly tiempoCorte = signal(0);

  // Sección 2: Temporizadores
  protected readonly timerAdministrativo = signal(0);
  protected readonly timerCliente        = signal(0);
  protected readonly tiempoTolerancia    = signal(0);

  // Sección 3: Duración y distancia
  protected readonly umbralLargaDistancia = signal(0);
  protected readonly tiempoMargenManiobra = signal(0);
  protected readonly tiempoRetornoBase    = signal(0);

  // Sección 4: Proximidad de unidades
  protected readonly minutosCerca   = signal(0);
  protected readonly minutosMedio   = signal(0);
  protected readonly metrosCercania = signal(0);

  // Sección 5: Ubicación de referencia
  protected readonly coordLatMaps = signal('');
  protected readonly coordLonMaps = signal('');

  // UI: modales y estado de guardado
  protected readonly guardando        = signal(false);
  protected readonly showConfirm      = signal(false);
  protected readonly showExito        = signal(false);
  protected readonly showError        = signal(false);
  protected readonly mensajeResultado = signal('');

  ngOnInit(): void {
    this.adminSvc.getParametrosOperativos().subscribe((p) => {
      this.zonaHoraria.set(p.zonaHoraria);
      this.tiempoCorte.set(p.tiempoCorte);
      this.timerAdministrativo.set(p.timerAdministrativo);
      this.timerCliente.set(p.timerCliente);
      this.tiempoTolerancia.set(p.tiempoTolerancia);
      this.umbralLargaDistancia.set(p.umbralLargaDistancia);
      this.tiempoMargenManiobra.set(p.tiempoMargenManiobra);
      this.tiempoRetornoBase.set(p.tiempoRetornoBase);
      this.minutosCerca.set(p.minutosCerca);
      this.minutosMedio.set(p.minutosMedio);
      this.metrosCercania.set(p.metrosCercania);
      this.coordLatMaps.set(p.coordLatMaps);
      this.coordLonMaps.set(p.coordLonMaps);
    });
  }

  protected onGuardar(): void {
    if (this.guardando()) return;
    this.showConfirm.set(true);
  }

  protected onConfirmarGuardar(): void {
    this.showConfirm.set(false);
    if (this.guardando()) return;

    this.guardando.set(true);
    this.adminSvc.actualizarParametroOperativo({
      tiempoMargenManiobra: this.tiempoMargenManiobra(),
      tiempoRetornoBase:    this.tiempoRetornoBase(),
      umbralLargaDistancia: this.umbralLargaDistancia(),
      tiempoTolerancia:     this.tiempoTolerancia(),
      tiempoCorte:          this.tiempoCorte(),
      timerAdministrativo:  this.timerAdministrativo(),
      timerCliente:         this.timerCliente(),
      zonaHoraria:          this.zonaHoraria(),
      minutosCerca:         this.minutosCerca(),
      minutosMedio:         this.minutosMedio(),
      coordLatMaps:         this.coordLatMaps(),
      coordLonMaps:         this.coordLonMaps(),
      metrosCercania:       this.metrosCercania(),
    }).subscribe({
      next: result => {
        this.guardando.set(false);
        this.mensajeResultado.set(result.mensaje);
        if (result.exitoso === 1) {
          this.showExito.set(true);
        } else {
          this.showError.set(true);
        }
      },
      error: err => {
        this.guardando.set(false);
        this.mensajeResultado.set(err?.error?.mensaje ?? 'Error al guardar los parámetros operativos.');
        this.showError.set(true);
      },
    });
  }
}
