---
name: orbe-sessao-gravada
description: >-
  Define e implementa a skill ORBE de sessão gravada com o cliente: gravar a
  conversa, transcrever, extrair fatos e preencher/organizar o ciclo ORBE
  (diagnóstico, gaps, prioridades, rascunhos de plano). Use when the user
  mentions gravação, áudio, reunião com cliente, transcrição, voice-to-ORBE,
  sessão consultiva, ou captura conversacional do Método ORBE.
---

# ORBE — Sessão Gravada (Captura Conversacional)

Pedido do Daniel que **não está** nos PDFs/planilha de `Contexto/`: iniciar a
conversa com o cliente **gravando**; o sistema **transcreve** e **começa a
operar/organizar** a partir disso.

## Objetivo

Transformar a reunião consultiva (presencial ou online) na fonte primária de
dados do Método ORBE, reduzindo formulários manuais e acelerando a Fase **O –
Organizar**.

## Fluxo obrigatório

```
Iniciar sessão → Gravar áudio → Transcrever → Estruturar ORBE
→ Preencher gaps → Humano valida → Seguir R/B/E
```

1. **Iniciar sessão** — vincular a um cliente/lead no CRM (ou criar rascunho).
2. **Gravar** — áudio da conversa (app, Meet/Zoom export, WhatsApp voice, upload).
3. **Transcrever** — STT com diarização (consultor vs cliente) quando possível.
4. **Estruturar** — mapear falas → campos do diagnóstico ORBE (ver schema abaixo).
5. **Organizar** — marcar o que está preenchido, o que falta, maturidade sugerida,
   riscos e próximas perguntas.
6. **Validar** — Daniel revisa e confirma antes de gerar plano/proposta.
7. **Encadear** — com dados validados, acionar Analista → Planejador → etc.

## Schema de extração (alinhar ao diagnóstico ORBE)

Extrair e preencher apenas o que a conversa sustenta. Marcar `confianca`
(`alta` | `media` | `baixa`) e `evidencia` (trecho da transcrição).

### Dados da empresa
- nome, setor, tempo_mercado, colaboradores, faturamento_medio (se citado)

### Diagnóstico estratégico
- missao, visao, valores
- proposta_de_valor, produtos_servicos, diferenciais
- concorrentes, mercado

### Diagnóstico financeiro
- tem_controle, fluxo_caixa, dre, ferramentas
- ticket_medio, faturamento_mensal, margem, lucratividade, inadimplencia
- precificacao, ponto_equilibrio (se citados)

### Operacional / processos
- processos_criticos, gargalos, fluxo_informacao, tecnologia, padronizacao

### Comercial
- canais, conversao, rotina_vendas, materiais

### SWOT + maturidade
- forcas, fraquezas, oportunidades, ameacas
- maturidade_1_a_5 + justificativa breve

### Saídas operacionais da sessão
- prioridades_imediatas
- riscos
- perguntas_em_aberto (o que ainda precisa perguntar)
- acoes_candidatas (rascunhos de plano de ação, não commitados)

## Regras da skill

- **Não inventar números.** Se não foi dito, deixar vazio + listar em `perguntas_em_aberto`.
- **Separar fato vs interpretação.** Fato vai no campo; interpretação vai em
  `insights` / recomendações do Analista.
- **Consentimento.** Sessão só grava com aviso/aceite do cliente (LGPD). Guardar
  flag `consentimento_gravacao` + timestamp.
- **Humano no loop.** Nunca publicar relatório/proposta ao cliente sem validação.
- **Idempotência.** Reprocessar a mesma sessão atualiza o rascunho; não duplica
  diagnóstico fechado sem versão nova.
- **Retenção.** Áudio e transcrição são sensíveis; política de retenção explícita
  (ex.: áudio X dias, transcrição enquanto cliente ativo).

## Saída estruturada esperada (JSON lógico)

```json
{
  "sessao_id": "...",
  "cliente_id": "...",
  "fase_orbe": "O",
  "transcricao_resumo": "...",
  "campos_preenchidos": {},
  "gaps": [],
  "maturidade_sugerida": 2,
  "prioridades": [],
  "riscos": [],
  "perguntas_em_aberto": [],
  "acoes_candidatas": [],
  "status": "aguardando_validacao"
}
```

## Encaixe no produto

| Camada | Papel |
|--------|--------|
| UI | Botão "Iniciar sessão gravada" no cliente/CRM |
| Pipeline | Upload/stream → STT → LLM estruturador → núcleo ORBE |
| Agente Captura | Orquestra gravação + transcrição + primeiro preenchimento |
| Agente Diagnóstico | Completa ficha ORBE e gaps |
| Agente Analista | Prioridades e recomendações pós-validação parcial |

Prioridade de MVP: **P0** (entrada principal do diagnóstico, não nice-to-have).

## Ao implementar código

- Preferir STT com suporte a PT-BR e diarização.
- Guardar: `audio_url` (ou blob), `transcript_raw`, `transcript_segments[]`,
  `extraction_json`, `validated_by`, `validated_at`.
- UI mínima: gravar → ver transcrição → ver campos extraídos → editar/confirmar.
- Testar com reunião real curta (15–20 min) e medir % de campos preenchidos
  corretamente vs revisão manual.

## Fora de escopo desta skill

- Assessoria operacional de tesouraria em tempo real.
- Gravação clandestina / sem consentimento.
- Commit automático de metas financeiras sem validação do consultor.
