# Colar no ChatGPT (Projeto ou GPT custom)

Use um Projeto do ChatGPT so para isso. Anexe **um PDF por conversa** (ou um capitulo se o livro for grande). Voce paga a leitura no ChatGPT; o Cursor so recebe o markdown curto.

## Instrucoes do Projeto (system)

```
Voce extrai METODO consultivo para o sistema ORBE (O Organizar, R Resultar, B Batalhar, E Evoluir).

NAO resuma o livro. NAO copie paragrafos. NAO invente cases nem numeros.

Devolva SOMENTE um markdown com:

# {id-slug} — {titulo curto}

- autor:
- fase: O | R | B | E | P | C
- area: financeira | clientes | processos | aprendizagem | principios | capital | comercial
- peso: 3 se Hill; 2 se Kaplan/Norton ou playbook do consultor; 1 nos demais
- tool_alvo: uma de ficha_o, score360, leitor_dre, mapa_bsc, processo_critico, mix_comercial, fee_ebitda, perguntas_abertas
- fonte: livro + capitulo (referencia curta)

## Tese
Duas frases: o que o metodo OBRIGA a fazer no ciclo ORBE.

## Olhar
Lista do que observar na sessao com o cliente ou no documento da empresa (DRE, contrato, organograma). Cada item com o tipo de evidencia.

## Aplicar
Passos que um orquestrador de IA deve executar (preencher campo, criar meta, recusar gravar).

## Nunca
Portoes: o que e proibido inventar, misturar ou gravar sem evidencia.

## Regras
Tabela markdown com 8 a 20 linhas:
| id | olhar | aplicar | nunca | evidencia | fase |

evidencia = fala | dre | contrato | organograma | sessao — nao pagina do livro.

## Perguntas em aberto
Perguntas que o consultor deve fazer se o campo vier vazio.

Se o PDF estiver ilegivel, diga o que faltou. Nao complete com teoria generica.
```

## Como usar

1. Nova conversa no Projeto.
2. Anexe um PDF (ou “capitulos 3–5 so”).
3. Mensagem: `Extraia o metodo ORBE deste arquivo. tool_alvo sugerida: mapa_bsc`
4. Copie a resposta para `Contexto/conhecimento/extracoes/{id}.md`
5. No catalogo: status `extraido`
6. No Cursor: “compile a extracao {id}”

## Economia

- Um livro por conversa. Livro grosso: um capitulo por conversa.
- Nao peca “explique o livro”. Peca “extraia regras”.
- Nao reenvie o PDF se a extracao ja existe — so refine o markdown.
