# TechHelpDesk API

API REST para la gestión de tickets de soporte técnico, construida con NestJS, TypeORM 0.3.x y PostgreSQL (Supabase, schema `helpdesk`).

## Stack

- NestJS 11 + TypeScript
- TypeORM 0.3.x conectado mediante `DATABASE_URL`
- PostgreSQL / Supabase
- Autenticación JWT (AuthModule, JwtStrategy, JwtAuthGuard, RolesGuard, decoradores `@Roles` y `@CurrentUser`)
- Validación con `class-validator` y `class-transformer`
- Swagger en `http://localhost:3000/docs`
- Tests unitarios con Jest
- Docker / Docker Compose

## Requisitos previos

- Node.js 20+
- PostgreSQL 14+ o Supabase
- Docker + Docker Compose (opcional)

## Variables de entorno

1. Copia `.env.example` como `.env` y ajusta los valores:

```bash
cp .env.example .env
```

2. Variables principales:

- `DATABASE_URL`: URL de conexión a PostgreSQL/Supabase.
- `JWT_SECRET`: Llave para firmar los tokens.
- `JWT_EXPIRES_IN`: Duración del token en segundos.
- `NODE_ENV`: entorno (`development`, `production`, etc.).

La aplicación también lee `.env.docker` cuando se levanta con Docker Compose.

## Dump SQL

El archivo `helpdesk_dump.sql` contiene la definición básica del esquema `helpdesk` con datos iniciales (roles, usuarios de ejemplo, categorías, clientes, técnicos y tickets). Puedes importarlo con:

```bash
psql "$DATABASE_URL" -f helpdesk_dump.sql
```

## Instalación y ejecución local

```bash
cd backend
npm install
npm run start:dev
```

La API se expone en `http://localhost:3000` y Swagger en `http://localhost:3000/docs`.

## Ejecución con Docker

```bash
cd backend
docker compose build
docker compose up -d
```

La imagen usa el `Dockerfile` multi-stage e inyecta variables desde `.env.docker`.

## Scripts útiles

- `npm run start`: modo producción.
- `npm run start:dev`: modo desarrollo con watch.
- `npm run build`: compila el proyecto.
- `npm run test`: tests unitarios (TicketsService incluye casos de creación y cambio de estado).
- `npm run migration:run`: ejecuta migraciones TypeORM.

## Arquitectura resumida

- `src/auth`: autenticación con JWT y guards de roles.
- `src/users`: CRUD solo para administradores.
- `src/clients` / `src/technicians`: perfiles relacionados a usuarios.
- `src/tickets`: creación, asignación y seguimiento de tickets; endpoints adicionales para listar por cliente/técnico.
- `src/common`: ResponseInterceptor y HttpExceptionFilter registrados globalmente.

## Salud y documentación

- Endpoint de salud: `GET /health`
- Swagger/OpenAPI: `GET /docs` (incluye tags, DTOs con ejemplos y esquema de autenticación Bearer).

## Tests

Los tests unitarios se ubican en `src/**/*.spec.ts`. Ejemplo:

```bash
npm run test src/tickets/tickets.service.spec.ts
```

Se cubren escenarios de creación, asignación y cambio de estado de tickets.

## Licencia

Uso interno para la prueba “TechHelpDesk”. Ajusta según tus necesidades.
