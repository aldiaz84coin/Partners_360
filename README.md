# Partner 360°

Aplicación para gestionar la relación con partners tecnológicos siguiendo un marco
Partner 360º inspirado en ISO 44001: cuestionarios periódicos respondidos por
distintos stakeholders (Producto, Ventas, Preventa, Delivery, Operaciones, Partner
Owner), agregados en un dashboard de KPIs por partner, categoría y periodo.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack) + TypeScript + Tailwind CSS v4.
- **PostgreSQL** vía **Prisma 7** (driver adapter `@prisma/adapter-pg`, sin motor nativo en runtime).
- Autenticación propia por sesión firmada en cookie (JWT con `jose`), contraseñas con `bcryptjs`. Sin dependencias externas de auth.
- **Recharts** para las visualizaciones del dashboard.
- Despliegue en **Fly.io** vía Docker (build multi-stage, standalone output de Next.js).

## Modelo de datos

- `Category`: las 5 dimensiones del marco (REL, PER, BUS, INN, RSK) con su peso (%).
- `Question`: preguntas del cuestionario — alcance `CORE` (todos los stakeholders),
  `STRATEGIC` (todos, con foco a futuro) o `SPECIFIC` (un stakeholder concreto).
- `QuestionAudience`: qué roles responden cada pregunta y si es obligatoria u
  opcional para ese rol (la matriz ●/○ del marco).
- `Partner`, `User` (con `systemRole`: `ADMIN` / `VIEWER` / `EVALUATOR`),
  `PartnerAssignment` (qué usuario evalúa qué partner, con qué rol de stakeholder).
- `Period`: ventanas de evaluación (trimestres), `OPEN` o `CLOSED`.
- `Evaluation` + `Answer`: una evaluación es el conjunto de respuestas de un
  usuario, para un partner, en un periodo, actuando como un stakeholder concreto.

### Scoring

Cada respuesta 1–5 se normaliza a 0/25/50/75/100 (`N/A` se excluye). La puntuación
de una categoría es la media de sus respuestas normalizadas; la puntuación global
es la media ponderada de las categorías con datos (los pesos de las categorías sin
respuestas se redistribuyen). Ver `src/lib/scoring.ts`.

## Desarrollo local

Requiere Node 22+ y PostgreSQL.

```bash
npm install
cp .env.example .env   # ajusta DATABASE_URL y SESSION_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev
```

El seed crea las 5 categorías, las 39 preguntas del cuestionario (12 core + 3
estratégicas + 24 específicas), 2 partners de ejemplo, 3 periodos y estos usuarios:

| Email | Contraseña | Acceso |
|---|---|---|
| `admin@partners360.local` | `Admin123!` | Administrador (backend + dashboard) |
| `direccion@partners360.local` | `Partner123!` | Solo lectura (dashboard) |
| `producto@partners360.local` | `Partner123!` | Evaluador — Producto |
| `ventas@partners360.local` | `Partner123!` | Evaluador — Ventas |
| `preventa@partners360.local` | `Partner123!` | Evaluador — Ing. Preventa |
| `delivery@partners360.local` | `Partner123!` | Evaluador — Delivery |
| `operaciones@partners360.local` | `Partner123!` | Evaluador — Operaciones |
| `owner@partners360.local` | `Partner123!` | Evaluador — Partner Owner |

Cambia estas contraseñas (o las variables `SEED_ADMIN_PASSWORD` /
`SEED_DEMO_PASSWORD` antes de sembrar) antes de usar la app con datos reales.

## Despliegue en Fly.io

```bash
fly launch --no-deploy         # detecta el Dockerfile, crea la app y fly.toml
fly postgres create            # o reutiliza un cluster existente
fly postgres attach <nombre-del-cluster>   # define DATABASE_URL como secret automáticamente
fly secrets set SESSION_SECRET="$(openssl rand -base64 32)"
fly deploy
```

`fly.toml` incluye `release_command = "npx prisma migrate deploy"`, así que cada
`fly deploy` aplica las migraciones pendientes antes de sacar tráfico a la nueva
versión. Para cargar los datos de ejemplo tras el primer deploy:

```bash
fly ssh console -C "node_modules/.bin/tsx prisma/seed.ts"
```

(o ejecuta ese seed solo si quieres los datos de demo; en producción normalmente
crearás los partners, preguntas y usuarios reales desde `/admin`).

La app escala a 0 máquinas en reposo (`min_machines_running = 0` en `fly.toml`);
súbelo a `1` si prefieres evitar el cold start del primer request tras inactividad.

## Estructura de rutas

- `/login`, `/account` — autenticación y cambio de contraseña.
- `/evaluate` — evaluaciones pendientes/enviadas del usuario logueado.
- `/evaluate/[partnerId]/[periodId]/[role]` — formulario de una evaluación.
- `/dashboard`, `/dashboard/[partnerId]` — KPIs, por periodo (rol `ADMIN`/`VIEWER`).
- `/admin/*` — gestión de partners, stakeholders/usuarios, preguntas, categorías y
  periodos (rol `ADMIN`).
