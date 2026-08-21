# Sprint S2+ — STT n8n (Whisper)

## Entregável
Áudio da sessão → webhook n8n → Whisper → callback com transcript + diagnóstico rascunho.

## Aceite
- [x] Endpoint interno de download de áudio (`/api/internal/sessions/:id/audio`)
- [x] Workflow `ORBE — STT Sessao` publicado
- [x] `N8N_WEBHOOK_STT` apontando para o webhook de produção
- [x] Callback `/api/webhooks/n8n/session` com secret compartilhado

## Teste manual
1. Em Sessões, selecione um cliente, marque consentimento e envie um áudio curto (mp3/wav/webm/m4a).
2. Status deve ir para `processando`.
3. Em 30–90s (dependendo do Whisper), status `pronto` + link de diagnóstico.
