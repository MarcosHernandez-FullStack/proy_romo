import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Truck, Search, RefreshCw, Calendar } from 'lucide-angular';
import { AdminService } from '../../../core/services/admin.service';
import { DisponibilidadGrua } from '../../../models/admin.model';

@Component({
  selector: 'app-disponibilidad-gruas',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './disponibilidad-gruas.html',
})
export class DisponibilidadGruasComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);

  protected readonly TruckIcon    = Truck;
  protected readonly SearchIcon   = Search;
  protected readonly RefreshCwIcon = RefreshCw;
  protected readonly CalendarIcon = Calendar;

  protected readonly cargando     = signal(false);
  protected readonly datos        = signal<DisponibilidadGrua[]>([]);
  protected readonly fechaFiltro  = signal(this.hoy());
  protected readonly capFiltro    = signal<number | undefined>(undefined);
  /** Todas las capacidades activas → para el dropdown */
  protected readonly capacidades  = signal<number[]>([]);

  /** Capacidades presentes en el resultado actual → para las columnas de la tabla */
  protected readonly columnasTabla = computed(() =>
    [...new Set(this.datos().map(d => d.capacidad))].sort((a, b) => a - b)
  );

  /** Horas distintas presentes en los datos cargados */
  protected readonly horas = computed(() =>
    [...new Set(this.datos().map(d => d.horaStr))].sort()
  );

  /** Mapa [hora][capacidad] → fila para acceso rápido en la tabla */
  protected readonly mapaDisponibilidad = computed(() => {
    const mapa = new Map<string, Map<number, DisponibilidadGrua>>();
    for (const d of this.datos()) {
      if (!mapa.has(d.horaStr)) mapa.set(d.horaStr, new Map());
      mapa.get(d.horaStr)!.set(d.capacidad, d);
    }
    return mapa;
  });

  protected getCelda(hora: string, cap: number): DisponibilidadGrua | undefined {
    return this.mapaDisponibilidad().get(hora)?.get(cap);
  }

  ngOnInit(): void {
    this.adminSvc.getCapacidadesGruas().subscribe({
      next: caps => this.capacidades.set(caps),
    });
    this.cargar();
  }

  protected cargar(): void {
    const fecha = this.fechaFiltro();
    if (!fecha) return;
    this.cargando.set(true);
    this.adminSvc.getDisponibilidadGruas(fecha, this.capFiltro()).subscribe({
      next: data  => { this.datos.set(data ?? []); this.cargando.set(false); },
      error: ()   => this.cargando.set(false),
    });
  }

  protected onFechaChange(v: string): void {
    this.fechaFiltro.set(v);
    this.cargar();
  }

  protected onCapacidadChange(v: number | undefined): void {
    this.capFiltro.set(v);
    this.cargar();
  }

  protected disponibilidadBadge(d: DisponibilidadGrua | undefined): string {
    if (!d) return 'bg-[#f3f4f6] text-[#9ca3af]';
    if (d.cantidadGruasDisponible === 0) return 'bg-[#fef2f2] text-[#c10007] border border-[#fca5a5]';
    if (d.cantidadGruasDisponible <= 1)  return 'bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]';
    return 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]';
  }

  private hoy(): string {
    return new Date().toISOString().split('T')[0];
  }
}
