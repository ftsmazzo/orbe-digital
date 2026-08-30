# Schema da extracao (o GPT devolve isto)

Campos obrigatorios no frontmatter ou no cabecalho:

- `id`, `titulo`, `autor`, `fase`, `area`, `peso`, `tool_alvo`
- `tese` (max 2 frases)
- listas `olhar`, `aplicar`, `nunca`
- tabela `regras` (8 a 20 linhas): `id | olhar | aplicar | nunca | evidencia | fase`
- `perguntas_abertas`

Recusar se:

- tiver citacao com mais de 2 frases seguidas do livro
- for sumario capitulo a capitulo
- inventar numero, case ou formula que o livro nao sustentou
- faltar coluna `nunca` ou `evidencia`

`evidencia` e o tipo de prova no cliente (fala na sessao, DRE, contrato, organograma) — nao o numero da pagina do livro.
