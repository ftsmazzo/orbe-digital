# Acervo local ORBE (copia — nao e o drive do Daniel)

O OneDrive dele e **somente leitura**. Voce baixa uma copia para esta pasta e organiza aqui. Nada volta para o drive.

## Pastas

| Pasta | O que entra | Git |
| --- | --- | --- |
| `_inbox/` | Download cru, nome bagunçado | ignorado |
| `pdf/` | PDF renomeado e separado por fase | ignorado |
| `extracoes/` | Markdown de metodo (8–20 regras por livro) | versionado |
| `catalogo.md` | Inventario + tags | versionado |
| `tags.md` | Vocabulario de tags | versionado |

Crie `_inbox/` e `pdf/` na primeira descarga. Elas nao vao para o GitHub.

## Fluxo

1. No OneDrive: **Baixar** a pasta (zip) ou os PDFs. Nao edite, nao renomeie, nao apague la.
2. Jogue o zip/PDFs em `_inbox/`.
3. Renomeie para `pdf/{fase}/{peso}-{autor}--{titulo}.pdf` (ver `tags.md`).
4. Uma linha no `catalogo.md` (status `inbox` → `renomeado` → `extraido` → `tool`).
5. No ChatGPT (skill em `.cursor/skills/orbe-conhecimento-metodo/gpt-instrucao.md`): anexe **um** PDF ou um capitulo. Salve a saida em `extracoes/{id}.md`.
6. No Cursor: “compilar extracao X em tool/ficha”. O agente le o markdown, nao o livro.

Nao cole livro inteiro no app, no RAG nem no git. So regra, olhar, portao e evidencia.
