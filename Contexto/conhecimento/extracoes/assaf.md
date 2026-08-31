# assaf — Leitura financeira além da variação

- autor: Alexandre Assaf Neto
- fase: O
- area: financeira
- peso: 1
- tool_alvo: leitor_dre
- fonte: Estrutura e Análise de Balanços — Manual de Solução, 4ª ed., caps. 7 “Análise Horizontal e Vertical”, 11 “Indicadores de Liquidez e Ciclo Operacional” e 12 “Análise Dinâmica do Capital de Giro”
- limitação da fonte: o PDF contém o Manual de Solução, não o livro-texto integral. Há exercícios resolvidos e aplicações, mas faltam as exposições conceituais completas; a formulação detalhada da liquidez geral não aparece de forma legível no arquivo e não foi completada com teoria externa.

## Tese

O método obriga o leitor a ultrapassar a descrição das variações e relacionar estrutura patrimonial, liquidez, composição do endividamento, necessidade de investimento em giro e duração do ciclo financeiro. Todo cálculo deve usar contas identificadas no demonstrativo e períodos comparáveis; quando faltar conta, período ou classificação, o sistema deve suspender o índice e abrir pergunta.

## Olhar

- Datas de encerramento e duração dos exercícios comparados — evidência: dre.
- Critério monetário usado em cada período, inclusive eventual correção — evidência: dre.
- Total do ativo e total do passivo mais patrimônio líquido de cada período — evidência: dre.
- Participação de cada conta ou grupo em sua base de comparação — evidência: dre.
- Ativo circulante, estoques, despesas antecipadas e passivo circulante — evidência: dre.
- Disponibilidades e aplicações com liquidez imediata — evidência: dre.
- Passivo exigível total, exigível de curto prazo e exigível de longo prazo — evidência: dre.
- Patrimônio líquido evidenciado no balanço — evidência: dre.
- Ativos e passivos circulantes classificados como financeiros ou cíclicos — evidência: dre.
- Clientes, estoques e demais ativos ligados à operação — evidência: dre.
- Fornecedores, salários, tributos e demais passivos ligados à operação — evidência: dre.
- Vendas, vendas a prazo, compras, custo das mercadorias ou produtos vendidos — evidência: dre.
- Prazos de estocagem, fabricação, venda, cobrança e pagamento — evidência: dre.
- Relação entre CCL, NIG/NCG e saldo disponível de tesouraria — evidência: dre.
- Dependência de empréstimos financeiros de curto prazo para financiar ativos cíclicos — evidência: dre.
- Informações sobre setor e sazonalidade declaradas e comprovadas pelo cliente — evidência: fala.

## Aplicar

1. Identificar empresa, moeda, unidade, data-base e duração de cada demonstrativo antes de comparar.
2. Recusar análise horizontal quando os períodos não forem casados ou não houver base comparável.
3. Na análise horizontal, calcular a relação entre o valor do período analisado e o valor do período-base somente para a mesma conta e o mesmo critério contábil.
4. Na análise vertical do balanço, usar o total do ativo ou o total do passivo mais patrimônio líquido do próprio período como base.
5. Na análise vertical da DRE, usar a receita de vendas do mesmo período como base.
6. Calcular liquidez corrente somente com `ativo_circulante / passivo_circulante` evidenciados.
7. Calcular liquidez seca somente quando ativo circulante, estoques, despesas antecipadas e passivo circulante estiverem identificados.
8. Calcular liquidez imediata somente com disponibilidades efetivamente classificadas e passivo circulante evidenciado.
9. Não calcular liquidez geral a partir deste manual quando as contas e a fórmula aplicável não estiverem explicitadas no demonstrativo e na fonte disponível.
10. Calcular CCL por `ativo_circulante - passivo_circulante` e tratá-lo como medida estática, não como fluxo de caixa.
11. Calcular endividamento somente após definir, conforme a conta evidenciada, passivo exigível total, curto prazo, longo prazo, ativo total e patrimônio líquido.
12. Separar endividamento total de composição das exigibilidades; não reduzir a análise a um único percentual.
13. Reclassificar o circulante em financeiro e cíclico somente quando a natureza de cada conta estiver identificada.
14. Calcular NIG/NCG por `ativo_cíclico - passivo_cíclico` somente após validar a classificação das contas operacionais.
15. Calcular saldo de tesouraria por `ativo_financeiro - passivo_financeiro` e conferir sua consistência com `CCL - NIG/NCG`.
16. Calcular ciclo operacional pela soma dos prazos operacionais aplicáveis e ciclo financeiro pela dedução do prazo de pagamento a fornecedores.
17. Usar vendas a prazo, compras e custos do mesmo período nos indicadores de atividade; se esses dados não estiverem publicados, recusar o prazo correspondente.
18. Comparar a evolução conjunta de CCL, NIG/NCG e saldo de tesouraria antes de descrever equilíbrio ou pressão financeira.
19. Registrar dependência de crédito de curto prazo apenas quando o passivo financeiro circulante estiver financiando necessidade operacional evidenciada.
20. Abrir pergunta quando faltar detalhamento de conta, período, natureza financeira/cíclica ou dado operacional necessário ao cálculo.

## Nunca

- Inventar índice, conta, saldo, prazo, classificação ou denominador.
- Calcular indicador com conta agregada cuja composição necessária não esteja disponível.
- Comparar períodos de durações diferentes sem ajuste e evidenciação do critério.
- Misturar valores nominais e reais na mesma análise horizontal.
- Misturar balanço de uma data com DRE de período incompatível.
- Tratar lucro contábil por competência como entrada de caixa.
- Tratar CCL, NIG/NCG ou saldo de tesouraria como sinônimos de caixa gerado.
- Concluir insolvência apenas porque a liquidez é inferior a 1 ou o CCL é negativo.
- Concluir segurança financeira apenas porque a liquidez corrente é superior a 1.
- Classificar automaticamente toda conta circulante como operacional.
- Usar vendas totais como vendas a prazo sem evidenciação.
- Usar compras estimadas para calcular prazo de fornecedores sem registrar e validar a origem.
- Aplicar média setorial quando o setor não tiver sido declarado e comprovado pelo cliente.
- Explicar variação por sazonalidade, política comercial ou mercado sem evidência.
- Completar a liquidez geral com fórmula externa não presente no arquivo.

## Regras

| id | olhar | aplicar | nunca | evidencia | fase |
|---|---|---|---|---|---|
| ASS-O-01 | datas e duração dos demonstrativos | casar data-base e extensão dos períodos antes da AH | comparar exercício anual com período parcial sem ajuste | dre | O |
| ASS-O-02 | mesma conta em períodos sucessivos | calcular AH apenas sobre conta e critério equivalentes | comparar rubricas com conteúdo diferente | dre | O |
| ASS-O-03 | base monetária dos períodos | separar evolução nominal de evolução real quando o demonstrativo trouxer correção | misturar valores nominais e corrigidos | dre | O |
| ASS-O-04 | estrutura do balanço | calcular AV de cada grupo sobre o total do próprio período | usar total de outro período como base | dre | O |
| ASS-O-05 | estrutura da DRE | calcular AV das contas de resultado sobre a receita do mesmo período | usar receita de período incompatível | dre | O |
| ASS-O-06 | ativo e passivo circulantes | calcular `LC = AC / PC` | calcular LC sem AC ou PC evidenciado | dre | O |
| ASS-O-07 | estoques e despesas antecipadas | calcular LS somente com exclusões identificadas no AC | presumir composição do circulante | dre | O |
| ASS-O-08 | disponibilidades | calcular liquidez imediata apenas com caixa e equivalentes identificados | tratar todo ativo financeiro como caixa imediato | dre | O |
| ASS-O-09 | liquidez geral | manter índice pendente se fórmula e contas aplicáveis não estiverem evidenciadas | completar a lacuna com teoria externa | dre | O |
| ASS-O-10 | capital circulante líquido | calcular `CCL = AC - PC` e comparar sua evolução | interpretar CCL como fluxo de caixa | dre | O |
| ASS-O-11 | capital de terceiros | calcular endividamento com passivo exigível e base patrimonial explicitados | trocar passivo exigível por passivo total sem informar | dre | O |
| ASS-O-12 | prazos das dívidas | separar participação de curto e longo prazo | concluir risco apenas pelo total endividado | dre | O |
| ASS-O-13 | contas ligadas à operação | classificar ativo e passivo cíclicos conta a conta | classificar por posição no balanço somente | dre | O |
| ASS-O-14 | ativo e passivo cíclicos | calcular `NIG/NCG = ativo_cíclico - passivo_cíclico` | calcular NCG com contas não classificadas | dre | O |
| ASS-O-15 | ativo e passivo financeiros | calcular `SD = ativo_financeiro - passivo_financeiro` e conferir `CCL - NIG/NCG` | chamar saldo de tesouraria de lucro ou caixa gerado | dre | O |
| ASS-O-16 | NIG/NCG superior ao CCL | verificar passivos financeiros de curto prazo usados no financiamento | concluir insolvência automaticamente | dre | O |
| ASS-O-17 | prazos operacionais | somar estocagem, fabricação, venda e cobrança aplicáveis ao ciclo operacional | incluir prazo inexistente ou não aplicável | dre | O |
| ASS-O-18 | prazo de fornecedores | calcular ciclo financeiro subtraindo o prazo de pagamento comprovado | estimar prazo sem compras ou fornecedores evidenciados | dre | O |
| ASS-O-19 | vendas, compras e custos | usar numeradores e denominadores do mesmo período e regime | misturar caixa com competência | dre | O |
| ASS-O-20 | referência setorial | usar média do setor apenas após identificação comprovada do setor | escolher setor por aparência ou nome empresarial | fala | O |

## Perguntas em aberto

- Quais são as datas-base e a duração exata de cada demonstrativo?
- Os valores estão na mesma moeda, unidade e critério de atualização?
- Houve mudança no plano de contas ou reclassificação entre os períodos?
- Qual é a composição do ativo circulante em cada período?
- Qual é a composição do passivo circulante em cada período?
- Quais saldos representam disponibilidades ou equivalentes de caixa?
- Quais valores correspondem a estoques e despesas antecipadas?
- Quais contas formam o passivo exigível total?
- Quanto do endividamento vence no curto prazo e quanto vence no longo prazo?
- Qual conta do demonstrativo sustenta cada numerador e denominador do índice solicitado?
- Quais contas circulantes são financeiras e quais decorrem diretamente da operação?
- Quais contas compõem o ativo cíclico?
- Quais contas compõem o passivo cíclico?
- Existem empréstimos bancários de curto prazo financiando clientes ou estoques?
- Qual parcela das vendas foi realizada a prazo?
- Qual foi o valor das compras no período?
- Qual custo deve ser associado ao giro dos estoques no mesmo período?
- Quais são os prazos médios de estocagem, fabricação, venda e cobrança?
- Qual é o prazo médio efetivo de pagamento a fornecedores?
- Os dados dos prazos pertencem ao mesmo período dos saldos utilizados?
- O setor de atividade foi declarado pelo cliente e qual documento o comprova?
- Há sazonalidade declarada e evidenciada que explique a formação dos saldos?
- Existe demonstração de fluxo de caixa para confrontar a leitura por competência?
- Quais contas e qual formulação o cliente adota para a liquidez geral, já que essa exposição não está completa no PDF fornecido?
