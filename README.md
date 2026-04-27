# acquisitions

Node/Express API with Drizzle ORM and Neon Postgres.

## Docker Overview

This project uses a multi-stage Dockerfile and two Compose files:

- `docker-compose.dev.yml` builds the `development` Docker target and runs the
  app with Neon Local.
- `docker-compose.prod.yml` builds the `production` Docker target and connects
  the app directly to Neon Cloud with `DATABASE_URL`.

The production stack does not run Neon Local.

## Dockerfile Targets

The Dockerfile defines three stages:

- `base`: installs production dependencies, copies the app, creates a non-root
  `nodejs` user, exposes port `8080`, and defines a health check.
- `development`: installs all dependencies and runs `npm run dev`.
- `production`: runs the app with `npm start`.

Development Compose uses:

```yaml
target: development
```

Production Compose uses:

```yaml
target: production
```

## Development With Neon Local

`docker-compose.dev.yml` starts two services on the `acquisitions-dev` network:

- `acquisitions-neon-local`: Neon Local proxy using
  `neondatabase/neon_local:latest`.
- `acquisitions-app-dev`: the Node.js app running with hot reload.

Neon Local receives:

```env
NEON_API_KEY=replace-with-your-neon-api-key
NEON_PROJECT_ID=replace-with-your-neon-project-id
BRANCH_ID=
```

If `BRANCH_ID` is empty, Neon Local creates an ephemeral branch. The Compose file
mounts `.neon_local/` plus `.git/HEAD` so Neon Local can persist branch metadata
per git branch.

The app connects to Neon Local inside the Docker network with:

```env
DATABASE_URL=postgres://neon:npg@neon-local:5432/neondb?sslmode=require
NEON_FETCH_ENDPOINT=http://neon-local:5432/sql
```

`NEON_FETCH_ENDPOINT` is required because this app uses
`@neondatabase/serverless`.

### `.env.development`

```env
PORT=8080
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8080

POSTGRES_DB=neondb
DATABASE_URL=postgres://neon:npg@localhost:5432/neondb?sslmode=require
NEON_FETCH_ENDPOINT=http://localhost:5432/sql

NEON_API_KEY=replace-with-your-neon-api-key
NEON_PROJECT_ID=replace-with-your-neon-project-id
BRANCH_ID=

ARCJET_ENV=development
```

Start development:

```sh
docker compose -f docker-compose.dev.yml --env-file .env.development up --build
```

The API is available at:

```text
http://localhost:8080
```

Run migrations against the Neon Local branch:

```sh
docker compose -f docker-compose.dev.yml --env-file .env.development exec app npm run db:migrate
```

Stop development:

```sh
docker compose -f docker-compose.dev.yml down
```

## Production With Neon Cloud

`docker-compose.prod.yml` starts one service on the `acquisitions-prod` network:

- `acquisitions-app-prod`: the production Node.js app container.

Production uses the real Neon Cloud URL. Neon Local is not part of the
production Compose file.

### `.env.production`

```env
PORT=8080
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGINS=https://your-production-domain.example

DATABASE_URL=postgres://user:password@ep-example.us-east-2.aws.neon.tech/dbname?sslmode=require

ARCJET_KEY=your-arcjet-key
ARCJET_ENV=production
```

Start production:

```sh
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

Run production migrations:

```sh
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm app npm run db:migrate
```

View logs:

```sh
docker compose -f docker-compose.prod.yml logs -f app
```

Stop production:

```sh
docker compose -f docker-compose.prod.yml down
```

## Runtime Differences

Development:

```env
NODE_ENV=development
DATABASE_URL=postgres://neon:npg@neon-local:5432/neondb?sslmode=require
NEON_FETCH_ENDPOINT=http://neon-local:5432/sql
```

Production:

```env
NODE_ENV=production
DATABASE_URL=postgres://...neon.tech.../dbname?sslmode=require
```

The app reads these values from environment variables in `src/config/database.js`.
No database URL is hardcoded into the Docker image.

## Volumes And Health Checks

Development mounts:

- `.:/app` for hot reload.
- `/app/node_modules` so container dependencies are not replaced by the host.
- `./logs:/app/logs` for app logs.
- `./.neon_local/:/tmp/.neon_local` for Neon Local metadata.
- `./.git/HEAD:/tmp/.git/HEAD:ro,consistent` so Neon Local can identify the
  current git branch.

Production mounts:

- `./logs:/app/logs`.

Production also sets container resource limits in Compose:

```yaml
memory: 512M
cpus: '0.5'
```
