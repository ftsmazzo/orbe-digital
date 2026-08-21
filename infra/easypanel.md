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
BETTER_AUTH_URL=https://orbe-app.kxryyk.easypanel.host
STORAGE_MODE=minio
MINIO_ENDPOINT=https://orbe-minio.kxryyk.easypanel.host
MINIO_ACCESS_KEY=orbeadmin
MINIO_SECRET_KEY=OrbeMinio2026Secure
MINIO_BUCKET=orbe
MINIO_REGION=us-east-1
UPLOAD_DIR=/tmp/orbe-uploads
N8N_WEBHOOK_STT=https://pazotti-n8n.kxryyk.easypanel.host/webhook/orbe-stt
N8N_CALLBACK_SECRET=orbe-callback-secret
```

> **MinIO / AWS SDK:** nunca use o hostname interno do Docker com underscore
> (`http://orbe_orbe-minio:9000`) — o SDK S3 responde `Invalid hostname`.
> Use o domínio público HTTPS acima.

## MinIO

Comando no EasyPanel (obrigatório o binário `minio`):

```
minio server /data --console-address :9001
```

Env do serviço MinIO:

```
MINIO_ROOT_USER=orbeadmin
MINIO_ROOT_PASSWORD=OrbeMinio2026Secure
MINIO_SERVER_URL=https://orbe-minio.kxryyk.easypanel.host
MINIO_BROWSER_REDIRECT_URL=https://orbe-minio-console.kxryyk.easypanel.host
```

Se usar só `server /data...`, o log fica `server: command not found` e o serviço fica amarelo.

## Workflow STT (n8n)

- Nome: **ORBE — STT Sessao**
- Editor: https://pazotti-n8n.kxryyk.easypanel.host/workflow/tXFEYux7CaDfsiTZ
- Webhook produção: `https://pazotti-n8n.kxryyk.easypanel.host/webhook/orbe-stt`
- Fluxo: webhook → baixar áudio da app → Whisper → callback `/api/webhooks/n8n/session`
- Download interno: `GET /api/internal/sessions/:id/audio` (header `x-orbe-callback-secret`)

> Nota: o workflow está no n8n Pazotti (já com OpenAI). O `orbe-n8n` no EasyPanel ficou com owner criado para migrar depois.

## Local

```bash
docker compose -f infra/docker-compose.yml up -d
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```
