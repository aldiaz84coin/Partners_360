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
- `Partner`: ficha del partner — categoría (`ESTRATEGICO`/`ESTANDAR`/`NUEVO`), área
  tecnológica (`AUTOMATIZACION`/`DIGITALIZACION`, admite ambas), `Technology[]`
  (catálogo de tags editable en `/admin/technologies`), fechas de inicio y
  vigencia del acuerdo, y contacto principal.
- `User` (con `systemRole`: `ADMIN` / `VIEWER` / `EVALUATOR`), `PartnerAssignment`
  (qué usuario evalúa qué partner, con qué rol de stakeholder).
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
fly secrets set DATABASE_URL="postgresql://..."            # ver nota sobre Supabase abajo
fly secrets set SESSION_SECRET="$(openssl rand -base64 32)"
fly secrets set ADMIN_EMAIL="tu@empresa.com" ADMIN_PASSWORD="..."   # admin inicial
fly deploy
```

### Qué ocurre en cada arranque

`scripts/start.sh` es el entrypoint del contenedor y hace tres cosas antes de
levantar el servidor:

1. `prisma migrate deploy` — aplica las migraciones pendientes.
2. `prisma/bootstrap.ts` — idempotente: crea las 5 categorías y las 39 preguntas
   del marco si no existen, y crea **un** usuario administrador
   (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) la primera vez que no hay ninguno. Sin este
   paso, una base recién migrada no tendría usuarios y nadie podría entrar. Si ya
   existe un admin, no se toca su contraseña; si editas preguntas o pesos desde
   `/admin`, tampoco se sobrescriben en el siguiente deploy.
3. Arranca Next.js.

Deliberadamente **no** usamos el `release_command` de `fly.toml`: los logs de la
máquina de release suelen no poder recuperarse ("timeout waiting for release
command logs"), lo que convierte cualquier error de migración en un `exit code 1`
sin causa visible. En el arranque, el error real aparece en los logs de la app
(`fly logs -a <app>` o el dashboard).

### Base de datos con Supabase

Usa la **conexión directa** (Project Settings → Database → Connection string):

```
postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres?sslmode=no-verify
```

Importante: `sslmode=no-verify`, no `require`. Desde `pg` 8.16 (el driver que usa
`@prisma/adapter-pg`), `sslmode=require` pasó a exigir verificación completa de
la cadena de certificados — y el certificado de Supabase no valida contra la CA
por defecto de Node, así que cualquier consulta (no las migraciones, que usan el
motor de Prisma y no este driver) falla con
`Error opening a TLS connection: self-signed certificate in certificate chain`.
`no-verify` sigue cifrando la conexión, solo que no valida la cadena.

Ese host resuelve solo a IPv6, lo cual funciona sin problema desde Fly.io. El
Session pooler (`aws-0-<region>.pooler.supabase.com`) es la alternativa para
redes IPv4-only, pero exige acertar la región del pooler y usar
`postgres.<project-ref>` como usuario; si te equivocas de shard obtendrás
`FATAL: (ENOTFOUND) tenant/user ... not found`.

Ojo con dos cosas que producen un `P1000: Authentication failed` poco obvio:

- La contraseña de **base de datos** no es la de tu cuenta de Supabase. Si el
  proyecto se creó por API, se generó una aleatoria: resetéala en
  Project Settings → Database → *Reset database password*.
- Si la contraseña lleva caracteres especiales, deben ir percent-encoded en la
  URL (`!` → `%21`). Lo más simple es usar una alfanumérica.

### Datos de demo (opcional)

El bootstrap no crea partners ni evaluadores de ejemplo. Para cargarlos:

```bash
fly ssh console -C "node_modules/.bin/tsx prisma/seed.ts"
```

En producción lo normal es crear los partners, stakeholders y periodos reales
desde `/admin`.

La app escala a 0 máquinas en reposo (`min_machines_running = 0` en `fly.toml`);
súbelo a `1` si prefieres evitar el cold start del primer request tras inactividad.

## Estructura de rutas

- `/login`, `/account` — autenticación y cambio de contraseña.
- `/evaluate` — evaluaciones pendientes/enviadas del usuario logueado.
- `/evaluate/[partnerId]/[periodId]/[role]` — formulario de una evaluación.
- `/dashboard`, `/dashboard/[partnerId]` — KPIs, por periodo (rol `ADMIN`/`VIEWER`).
- `/admin/*` — gestión de partners, stakeholders/usuarios, preguntas, categorías y
  periodos (rol `ADMIN`).
