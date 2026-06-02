import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Save, Info, Clock, Timer, Route, Navigation, MapPin } from 'lucide-angular';
import { ConfiguracionService } from '../../../../core/services/configuracion.service';
import { ErroresParametros } from '../../../../models/configuracion.model';
import { MensajeModalComponent } from '../../../../shared/components/mensaje-modal/mensaje-modal';
import { ExitoModalComponent } from '../../../../shared/components/exito-modal/exito-modal';

@Component({
  selector: 'app-parametros',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MensajeModalComponent, ExitoModalComponent],
  templateUrl: './parametros.html',
})
export class ParametrosComponent implements OnInit {
  private readonly configuracionSvc = inject(ConfiguracionService);

  protected readonly SaveIcon       = Save;
  protected readonly InfoIcon       = Info;
  protected readonly ClockIcon      = Clock;
  protected readonly TimerIcon      = Timer;
  protected readonly RouteIcon      = Route;
  protected readonly NavigationIcon = Navigation;
  protected readonly MapPinIcon     = MapPin;

  protected readonly zonaHoraria          = signal('');
  protected readonly tiempoCorte          = signal(0);
  protected readonly timerAdministrativo  = signal(0);
  protected readonly timerCliente         = signal(0);
  protected readonly tiempoTolerancia     = signal(0);
  protected readonly umbralLargaDistancia = signal(0);
  protected readonly tiempoMargenManiobra = signal(0);
  protected readonly tiempoRetornoBase    = signal(0);
  protected readonly minutosCerca         = signal(0);
  protected readonly minutosMedio         = signal(0);
  protected readonly metrosCercania       = signal(0);
  protected readonly coordLatMaps         = signal('');
  protected readonly coordLonMaps         = signal('');

  private readonly parametroId = signal(0);

  protected readonly guardando        = signal(false);
  protected readonly showConfirm      = signal(false);
  protected readonly showExito        = signal(false);
  protected readonly mensajeResultado = signal('');
  protected readonly errorEstado      = signal<{ tipo: 'error' | 'advertencia'; titulo: string; mensaje: string } | null>(null);
  protected readonly intentoGuardar   = signal(false);

  protected readonly errores = computed<ErroresParametros>(() => {
    const e: ErroresParametros = {};
    if (!this.intentoGuardar()) return e;
    if (!this.zonaHoraria().trim())              e.zonaHoraria          = 'La zona horaria es obligatoria.';
    else if (this.zonaHoraria().length > 50)     e.zonaHoraria          = 'Máximo 50 caracteres.';
    if (this.tiempoCorte() <= 0)                 e.tiempoCorte          = 'Debe ser mayor a 0.';
    if (this.timerAdministrativo() <= 0)         e.timerAdministrativo  = 'Debe ser mayor a 0.';
    if (this.timerCliente() <= 0)                e.timerCliente         = 'Debe ser mayor a 0.';
    if (this.tiempoTolerancia() < 0)             e.tiempoTolerancia     = 'No puede ser negativo.';
    if (this.tiempoMargenManiobra() <= 0)        e.tiempoMargenManiobra = 'Debe ser mayor a 0.';
    if (this.tiempoRetornoBase() <= 0)           e.tiempoRetornoBase    = 'Debe ser mayor a 0.';
    if (this.umbralLargaDistancia() <= 0)        e.umbralLargaDistancia = 'Debe ser mayor a 0.';
    if (this.minutosCerca() <= 0)                e.minutosCerca         = 'Debe ser mayor a 0.';
    if (this.minutosMedio() <= 0)                e.minutosMedio         = 'Debe ser mayor a 0.';
    else if (this.minutosMedio() <= this.minutosCerca())
      e.minutosMedio = `Debe ser mayor a Minutos Cerca (${this.minutosCerca()}).`;
    if (this.metrosCercania() <= 0)              e.metrosCercania       = 'Debe ser mayor a 0.';
    if (!this.coordLatMaps().trim())             e.coordLatMaps         = 'La latitud es obligatoria.';
    else if (this.coordLatMaps().length > 20)    e.coordLatMaps         = 'Máximo 20 caracteres.';
    if (!this.coordLonMaps().trim())             e.coordLonMaps         = 'La longitud es obligatoria.';
    else if (this.coordLonMaps().length > 20)    e.coordLonMaps         = 'Máximo 20 caracteres.';
    return e;
  });

  ngOnInit(): void {
    this.configuracionSvc.getParametroOperativo().subscribe((p) => {
      this.parametroId.set(p.id);
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
    this.intentoGuardar.set(true);
    if (Object.keys(this.errores()).length > 0 || this.guardando()) return;
    this.showConfirm.set(true);
  }

  protected onConfirmarGuardar(): void {
    this.showConfirm.set(false);
    if (this.guardando()) return;

    this.guardando.set(true);
    this.configuracionSvc.actualizarParametroOperativo({
      id:                   this.parametroId(),
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
        if (result.exitoso === 1) {
          this.mensajeResultado.set(result.mensaje);
          this.showExito.set(true);
        } else if (result.exitoso === 2) {
          this.errorEstado.set({ tipo: 'advertencia', titulo: 'Tiempo de espera agotado', mensaje: result.mensaje });
        } else {
          this.errorEstado.set({ tipo: 'error', titulo: 'Error al Actualizar', mensaje: result.mensaje });
        }
      },
      error: err => {
        this.guardando.set(false);
        this.errorEstado.set({ tipo: 'error', titulo: 'Error al Actualizar', mensaje: err.error?.mensaje ?? 'Error al guardar los parámetros operativos.' });
      },
    });
  }
}
