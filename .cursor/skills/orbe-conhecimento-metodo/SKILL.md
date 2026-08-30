---
name: orbe-conhecimento-metodo
description: >-
  Organizes the local ORBE knowledge library (copy of Daniel's books), tags
  catalogs, and compiles GPT extraction markdowns into principle cards and
  executable tools. Use when the user mentions acervo, livros, conhecimento,
  OneDrive de PDFs, catalogo, tags, extracao de metodo, skill GPT, ou
  transformar livro em tool.
---

# ORBE — Conhecimento vira metodo (nao RAG de livro)

## Contrato

- O OneDrive do Daniel e **somente leitura**. Nunca editar, renomear, apagar ou enviar arquivo de volta.
- Trabalho so em `Contexto/conhecimento/` (copia local).
- PDF **nao** entra no git, no prompt do Cursor nem no RAG de producao.
- O que entra no produto: `extracoes/*.md` (8–20 regras) → ficha em `canon.ts` e/ou tool no orquestrador.

## Pastas

- `_inbox/` — download cru (gitignored)
- `pdf/{fase}/` — nome `peso-autor--titulo.pdf` (gitignored)
- `extracoes/` — saida do GPT (versionado)
- `catalogo.md` — uma linha por obra
- `tags.md` — vocabulario fechado
- Modelo: `extracoes/_modelo.md`

Fases: `O` `R` `B` `E` `P` `C`. Pesos: Hill 3, Kaplan/Daniel 2, resto 1.

## O que o agente faz

1. **Inventariar** — listar `_inbox/` ou `Livros Conhecimento/`, sugerir `id`, fase, peso, nome novo. Usuario confirma. Atualizar `catalogo.md`.
2. **Renomear local** — mover para `pdf/{fase}/` com o padrao de `tags.md`. Nao tocar no drive.
3. **Nao ler PDF inteiro** no Cursor. Pedir a extracao via ChatGPT (instrucao em [gpt-instrucao.md](gpt-instrucao.md)).
4. **Compilar** — ao receber `extracoes/{id}.md`, atualizar ficha em `apps/web/src/lib/knowledge/canon.ts` e, se houver regra executavel, propor tool (`ficha_o`, `mapa_bsc`, `leitor_dre`, etc.).
5. **Nunca** colar capitulo no `knowledgeChunks` nem commitar PDF.

## Ordem de compilacao

1. Kaplan BSC + mapas (`mapa_bsc`)
2. Martins / Fipecafi (`leitor_dre`)
3. Playbook do Daniel (fee, admitir)
4. Hill (abertura)
5. Demais, um livro por vez

## Schema da extracao

Ver [schema-extracao.md](schema-extracao.md). Recusar markdown que seja resumo de livro.
