# Sprint S0 — Fundação

## Entregável
Monorepo Next.js + Drizzle, Docker Compose local, projeto EasyPanel `orbe` com Postgres.

## Aceite
- [x] `pnpm install` / estrutura monorepo
- [x] `infra/docker-compose.yml` (Postgres + MinIO + n8n)
- [x] Projeto EasyPanel `orbe` + `orbe-postgres`
- [x] Dockerfile para deploy
- [ ] App publicada no EasyPanel (após push GitHub)

## Como validar
```bash
pnpm install
# com Docker: docker compose -f infra/docker-compose.yml up -d
pnpm db:push && pnpm db:seed && pnpm dev
```
