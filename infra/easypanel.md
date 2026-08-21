# EasyPanel — projeto `orbe`

## Serviços (projeto `orbe`)

| Serviço | Tipo | Domínio / acesso |
|---------|------|------------------|
| `orbe-postgres` | PostgreSQL 17 | Interno `orbe_orbe-postgres:5432` · exposto `46.62.130.249:15432` |
| `orbe-n8n` | App image | https://orbe-n8n.kxryyk.easypanel.host |
| `orbe-minio` | App image | https://orbe-minio.kxryyk.easypanel.host · console `orbe-minio-console...` |
| `orbe-app` | App GitHub | https://orbe-app.kxryyk.easypanel.host (requer GitHub App EasyPanel no repo privado) |

Repo: https://github.com/ftsmazzo/orbe-digital

> **Deploy da app:** o serviço `orbe-app` já está cadastrado no EasyPanel com source GitHub.
> Se o deploy falhar com "Repository not found", autorize o GitHub App do EasyPanel no repo privado
> (`Settings → Integrations` no GitHub ou painel EasyPanel → GitHub).

## Credenciais Postgres

Interna (app na VPS):
```
postgresql://orbe:OrbePg2026Secure!@orbe_orbe-postgres:5432/orbe
```

Externa (dev local):
```
postgresql://orbe:OrbePg2026Secure!@46.62.130.249:15432/orbe
```

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
