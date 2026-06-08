# ROMO — Portal de Gestión de Grúas

Frontend del sistema **ROMO** para la reserva y despacho de grúas. Permite a clientes B2B crear y seguir sus solicitudes de servicio, y a administradores gestionar operaciones, flota, personal y reportes de cobranza.

---

## Arquitectura de la aplicación

El proyecto sigue una organización por capas con componentes standalone (sin NgModules):

```
src/app/
├── core/          → Guards, interceptores y servicios de alcance global
├── features/      → Módulos de negocio (lazy-loaded) por dominio y rol
├── shared/        → Componentes reutilizables entre features
├── layout/        → Shells de navegación para cliente y admin
└── models/        → Interfaces TypeScript organizadas por dominio
```

Las dependencias fluyen en una sola dirección: `features` y `layout` consumen `core` y `shared`; `core` consume `models`. Ninguna capa depende de `features`.

---

## Stack tecnológico

| Área              | Tecnología                                       |
|-------------------|--------------------------------------------------|
| Framework         | Angular 21 (standalone, control flow `@if/@for`) |
| Estilos           | Tailwind CSS v4 vía PostCSS                      |
| Lenguaje          | TypeScript 5.9 (strict mode)                     |
| Estado reactivo   | Signals (`signal`, `computed`, `effect`)         |
| Iconos            | lucide-angular                                   |
| Exportación Excel | exceljs (generación client-side con estilos)     |
| Testing           | Vitest + jsdom                                   |
| Mapas y rutas     | Google Maps API (Places)                         |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) ≥ 22
- npm ≥ 10.8
- [Angular CLI](https://angular.dev/tools/cli) 21: `npm install -g @angular/cli`
- Backend `back_romo` corriendo localmente, o acceso a la URL de producción en Azure

---

## Configuración de entornos

Los archivos de entorno están en `src/environments/`:

**`environment.ts`** — Desarrollo local
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5016/api',
};
```

**`environment.prod.ts`** — Producción (Azure Container Apps)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://ca-back-romo.whitedesert-ca97fbc6.eastus2.azurecontainerapps.io/api',
};
```

> La Google Maps API Key está referenciada directamente en `src/index.html`. Para desarrollo local asegúrate de que la clave tenga habilitado el dominio `localhost`.

---

## Ejecutar el proyecto

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:4200)
npm start

# Build de producción
npm run build

# Build en modo watch (desarrollo)
npm run watch

# Tests unitarios con Vitest
npm test
```

---

## Módulos del sistema y acceso por rol

### Portal Cliente

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión para clientes (rol `CLIENTE`) |
| `/nueva-reserva` | Wizard de 4 pasos para solicitar un servicio de grúa |
| `/mis-servicios` | Historial de servicios con estados y exportación Excel |

### Portal Administrador

| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Inicio de sesión para rol `ADMINISTRADOR` o `STAFF` |
| `/admin/dashboard` | KPIs operativos, alertas y próximos hitos |
| `/admin/nueva-reserva` | Reserva en nombre de un cliente (mismo wizard) |
| `/admin/operaciones` | Asignar, cancelar y reprogramar servicios |
| `/admin/agenda-maestra` | Horarios regulares y excepciones (feriados, bloqueos) |
| `/admin/clientes` | CRUD de clientes B2B |
| `/admin/operadores` | CRUD, disponibilidad y agenda de operadores |
| `/admin/flota` | Gestión de grúas: alta, mantenimiento y retorno |
| `/admin/disponibilidad-gruas` | Vista de disponibilidad por fecha y capacidad |
| `/admin/reportes` | Cobranza: facturación, pagos y revisión de cancelaciones |
| `/admin/usuarios` | Gestión de usuarios internos (ADMINISTRADOR / STAFF) |
| `/admin/configuracion` | Tarifario global y parámetros operativos del sistema |

### Flujo de la reserva (wizard compartido)

El componente `nueva-reserva` es utilizado tanto por clientes como por administradores y sigue un wizard de 4 pasos:

1. **Tipo de carga** — Estándar (1 vehículo) o Múltiple (2+)
2. **Cliente y ruta** — Selección de cliente, origen/destino con cálculo de distancia vía Google Maps
3. **Fecha y horario** — Calendario con slots, validación de disponibilidad y creación de timer de reserva
4. **Detalles del vehículo** — Tipo, placa, descripción y observaciones por cada vehículo

---

## Autenticación y guards

El sistema maneja dos sesiones independientes almacenadas en `localStorage`:

| Clave | Propósito |
|-------|-----------|
| `crane_user` | Sesión del cliente |
| `crane_admin` | Sesión del administrador |

Ambas almacenan el JWT con su `expiresAt`. Al cargar la app se valida la expiración; si venció se elimina la sesión automáticamente.

### Guards de ruta

| Guard | Protege | Redirige si falla |
|-------|---------|-------------------|
| `authGuard` | Rutas de cliente autenticado | `/login` |
| `noAuthGuard` | `/login` (evita re-login) | `/nueva-reserva` |
| `adminAuthGuard` | Rutas `/admin/*` | `/admin/login` |
| `noAdminAuthGuard` | `/admin/login` | `/admin/dashboard` |

### Interceptores HTTP

- **`authInterceptor`** — Inyecta `Authorization: Bearer <token>` en cada request. Prioriza el token de admin sobre el de cliente cuando ambas sesiones están activas.
- **`errorInterceptor`** — Maneja errores globales: `401` cierra ambas sesiones y redirige a `/login`; `429`, `504` y `403` muestran notificaciones toast.

---

## Estructura de carpetas

```
src/
├── app/
│   ├── core/
│   │   ├── guards/           # auth, no-auth, admin-auth, no-admin-auth
│   │   ├── interceptors/     # auth, error
│   │   └── services/         # AuthService, NotificationService y servicios de dominio
│   │
│   ├── features/
│   │   ├── cliente/
│   │   │   ├── login/
│   │   │   └── mis-servicios/
│   │   ├── admin/
│   │   │   ├── login-admin/
│   │   │   ├── dashboard/
│   │   │   ├── agenda-maestra/
│   │   │   ├── operaciones/
│   │   │   ├── clientes/
│   │   │   ├── operadores/
│   │   │   ├── flota/
│   │   │   ├── usuarios/
│   │   │   ├── configuracion/
│   │   │   ├── disponibilidad-gruas/
│   │   │   └── reportes/
│   │   └── nueva-reserva/    # Wizard compartido cliente + admin
│   │       ├── tipo-carga/
│   │       ├── seleccion-cliente/
│   │       ├── seleccion-agenda/
│   │       ├── detalles-vehiculo/
│   │       └── confirmacion-reserva/
│   │
│   ├── shared/
│   │   └── components/       # sidebar, admin-sidebar, toast, modales, error-banner
│   │
│   ├── layout/
│   │   ├── layout.ts         # Shell para portal cliente
│   │   └── admin-layout/     # Shell para portal admin
│   │
│   ├── models/               # Interfaces por dominio (auth, reservas, operaciones, flota…)
│   ├── app.routes.ts
│   ├── app.config.ts
│   └── app.ts
│
└── environments/
    ├── environment.ts        # Desarrollo
    └── environment.prod.ts   # Producción
```
