# Proyecto Base — Angular 21

Plantilla base para proyectos Angular con arquitectura escalable, lista para producción.

## Stack

- **Angular 21** — Standalone components
- **Tailwind CSS v4** — Estilos utilitarios vía PostCSS
- **tailwind-merge** — Fusión segura de clases Tailwind
- **lucide-angular** — Librería de iconos
- **Vitest** — Testing unitario

---

## Comandos

```bash
npm install        # Instalar dependencias
npm start          # Servidor de desarrollo (http://localhost:4200)
npm run build      # Build de producción
npm test           # Ejecutar tests unitarios
```

---

## Arquitectura de carpetas

```
src/
├── app/
│   │
│   ├── core/                  # Servicios y utilidades singleton (se proveen una sola vez)
│   │   ├── guards/            # Guards de rutas (ej: auth.guard.ts, role.guard.ts)
│   │   ├── interceptors/      # HTTP interceptors (ej: token, manejo de errores)
│   │   └── services/          # Servicios globales (ej: auth.service.ts)
│   │
│   ├── shared/                # Elementos reutilizables en toda la app
│   │   ├── components/        # Componentes UI sin lógica de negocio (dumb components)
│   │   │   ├── navbar/        # Barra de navegación superior
│   │   │   ├── sidebar/       # Panel lateral de navegación
│   │   │   └── footer/        # Pie de página
│   │   ├── directives/        # Directivas personalizadas reutilizables
│   │   └── pipes/             # Pipes personalizados reutilizables
│   │
│   ├── layout/                # Ensambla los componentes del shared para armar el panel
│   │   ├── layout.ts          # Importa navbar, sidebar, footer y contiene <router-outlet>
│   │   └── layout.html
│   │
│   ├── features/              # Módulos de negocio, cada uno lazy loaded
│   │   └── auth/              # Autenticación (rutas públicas)
│   │       ├── login/         # Componente de login
│   │       └── auth.routes.ts # Rutas del módulo auth
│   │
│   ├── models/                # Interfaces y tipos TypeScript compartidos
│   │
│   ├── app.ts                 # Componente raíz
│   ├── app.html               # Template raíz — solo contiene <router-outlet />
│   ├── app.routes.ts          # Rutas raíz — solo lazy imports hacia features/layout
│   └── app.config.ts          # Configuración global (providers, router, http)
│
├── environments/
│   ├── environment.ts         # Variables de entorno para desarrollo
│   └── environment.prod.ts    # Variables de entorno para producción
│
├── index.html                 # HTML raíz de la aplicación
├── main.ts                    # Bootstrap de la aplicación
└── styles.css                 # Estilos globales — @import "tailwindcss"
```

---

## Convenciones

- Todos los componentes son **standalone** (sin NgModules)
- Las rutas usan **lazy loading** con `loadComponent` o `loadChildren`
- Los guards se ubican en `core/guards/` y se registran en `app.routes.ts`
- Los servicios globales van en `core/services/`; los servicios de feature van dentro de su carpeta
- Nuevos roles o secciones → nueva carpeta dentro de `features/` con su propio `*.routes.ts`
