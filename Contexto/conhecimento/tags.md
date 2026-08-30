# Tags do acervo

Use so estes valores. Se faltar um, acrescente aqui primeiro.

## fase (pasta em `pdf/`)

| Tag | Significado | Tools tipicas |
| --- | --- | --- |
| `O` | Organizar — o que olhar na sessao e no documento | `ficha_o`, `score360`, `leitor_dre` |
| `R` | Resultar — metas, mapa, pesquisa | `mapa_bsc` |
| `B` | Batalhar — processo, PA, comercial | `processo_critico`, `mix_comercial` |
| `E` | Evoluir — cadencia, orcamento, fee | `fee_ebitda`, `perguntas_abertas` |
| `P` | Principios / conducao da conversa | abertura, desejo definido |
| `C` | Comercial / qualificacao (pre-ciclo) | admitir, proposta |

Livro pode ter `fase_secundaria` no catalogo. A pasta e a fase **primaria**.

## area

`financeira` · `clientes` · `processos` · `aprendizagem` · `principios` · `capital` · `comercial`

## peso

| Peso | Quando |
| --- | --- |
| 3 | Hill / manuscrito (abertura e persistencia) |
| 2 | Kaplan / Norton (BSC, mapas, SFO) |
| 2 | Playbook do Daniel (planilha, contrato, fee) |
| 1 | Demais |

## nome do arquivo

```
pdf/{fase}/{peso}-{autor-slug}--{titulo-slug}.pdf
```

Exemplos:

```
pdf/R/2-kaplan-norton--estrategia-em-acao-bsc.pdf
pdf/O/1-eliseu-martins--contabilidade-de-custos.pdf
pdf/P/3-napoleon-hill--manuscrito-original.pdf
```

Minusculas, hifen, sem acento no nome do arquivo. Titulo certo fica no `catalogo.md`.
