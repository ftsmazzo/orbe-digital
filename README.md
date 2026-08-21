# ORBE Digital

Sistema + CRM + Agentes para o Método ORBE (Daniel Herculis).

## Bases

1. **Local** — desenvolvimento (`pnpm dev`)
2. **GitHub** — código-fonte
3. **EasyPanel / VPS** — Postgres + MinIO + n8n + app

## Stack

Next.js 15 · TypeScript · Drizzle · PostgreSQL · Better Auth · n8n · MinIO

## Setup local

```bash
# Postgres local (Docker) OU use DATABASE_URL do EasyPanel
docker compose -f infra/docker-compose.yml up -d

cp apps/web/.env.example apps/web/.env.local
# ajuste DATABASE_URL

pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Login seed: `daniel@danielherculis.com.br` / `orbe-demo-2026`

## Sprints

Ver `docs/sprints/`.

## EasyPanel

Projeto `orbe` — ver `infra/easypanel.md`.
