# EasyPanel — projeto `orbe`

## Serviços

| Serviço | Tipo | Função |
|---------|------|--------|
| `orbe-postgres` | PostgreSQL 17 | Banco principal |
| `orbe-n8n` | App (image) | Agentes / STT / webhooks |
| `orbe-minio` | App (image) | Áudio e PDFs |
| `orbe-app` | App (GitHub) | Next.js — criar após push do repo |

## Credenciais Postgres (rede interna EasyPanel)

```
postgresql://orbe:OrbePg2026Secure!@orbe_orbe-postgres:5432/orbe
```

Host interno típico: `{project}_{service}` → `orbe_orbe-postgres`.

## Env sugerido para `orbe-app`

```
DATABASE_URL=postgresql://orbe:OrbePg2026Secure!@orbe_orbe-postgres:5432/orbe
BETTER_AUTH_SECRET=<gerar-32-chars>
BETTER_AUTH_URL=https://<dominio-app>
STORAGE_MODE=minio
MINIO_ENDPOINT=http://orbe_orbe-minio:9000
MINIO_ACCESS_KEY=orbeadmin
MINIO_SECRET_KEY=OrbeMinio2026Secure
MINIO_BUCKET=orbe
N8N_WEBHOOK_STT=https://<dominio-n8n>/webhook/orbe-stt
N8N_CALLBACK_SECRET=<shared-secret>
```

## Local

```bash
docker compose -f infra/docker-compose.yml up -d
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```
