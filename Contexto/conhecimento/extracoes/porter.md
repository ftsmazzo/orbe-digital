# porter — Concorrência evidenciada no mix comercial

id: porter  
tool_alvo: mix_comercial  
fase: R  
area: clientes  
peso: 1  
fonte: Michael E. Porter, *Competitive Advantage* (caps. 1–4, 7–8) e *The Competitive Advantage of Nations* (cap. 2)

## Tese

Estratégia competitiva só entra no diagnóstico quando fala, sessão ou documento identifica fatos sobre preço, rival, cliente, fornecedor, substituto, barreira, custo ou valor percebido. Sem lastro, o sistema registra a lacuna e formula pergunta aberta; não transforma conceitos de Porter em fatos da empresa.

## Olhar

- Rivais citados e base concreta da disputa: preço, prazo, canal, serviço, qualidade ou funcionalidade. Evidência: `fala`, `contrato`, `sessao`.
- Pressão de clientes por desconto, prazo, exclusividade ou serviço, concentração das vendas e facilidade declarada de troca. Evidência: `fala`, `dre`, `contrato`, `sessao`.
- Pressão de fornecedores por preço, prazo, lote mínimo, exclusividade, escassez ou dependência de insumo. Evidência: `fala`, `dre`, `contrato`, `sessao`.
- Soluções que atendem à mesma necessidade do cliente, ainda que de outra categoria. Evidência: `fala`, `contrato`, `sessao`.
- Entrantes citados e barreiras concretas: capital, canal, escala, tecnologia, contrato, licença, reputação ou custo de troca. Evidência: `fala`, `contrato`, `sessao`.
- Preço baixo não prova posição de custo; vantagem de custo exige atividade ou conta que explique custo relativo menor. Evidência: `dre`, `fala`, `sessao`.
- Atributo só configura diferenciação quando ligado a critério de compra, redução de custo do cliente ou melhora de desempenho. Evidência: `fala`, `contrato`, `sessao`.
- Enfoque exige segmento escolhido deliberadamente e necessidades ou atividades distintas. Poucos clientes não bastam. Evidência: `fala`, `contrato`, `sessao`.
- Mapear somente atividades executadas e relacioná-las a custo ou valor para o cliente. Evidência: `fala`, `dre`, `contrato`, `organograma`, `sessao`.
- Para substitutos, observar valor/preço relativo, custo de troca e propensão declarada do comprador a mudar. Evidência: `fala`, `contrato`, `sessao`.
- Fato interno vira força ou fraqueza somente com efeito evidenciado sobre custo, execução ou valor. Evidência: `fala`, `dre`, `contrato`, `organograma`, `sessao`.
- Fato externo vira oportunidade ou ameaça somente quando agente e impacto provável forem citados. Evidência: `fala`, `contrato`, `sessao`.

## Aplicar

1. Reunir fatos da sessão e documentos, preservando origem e período.
2. Classificar cada fato em rivalidade, poder de clientes, poder de fornecedores, entrantes ou substitutos.
3. Manter `nao_evidenciado` para toda força sem fato específico; ausência de relato não significa pressão fraca.
4. Ligar o fato competitivo a consequência declarada ou demonstrada: preço, volume, margem, custo, prazo, retenção ou escolha.
5. Só então classificar SWOT: interno como força/fraqueza; externo como oportunidade/ameaça.
6. Testar custo com atividades e contas evidenciadas. Sem base relativa, registrar `hipotese_de_custo`, nunca `lideranca_em_custo`.
7. Testar diferenciação ligando atributo a critério de compra ou valor e, se disponível, ao custo de sustentá-lo.
8. Testar enfoque comprovando segmento escolhido e vantagem de custo ou diferenciação dentro dele.
9. Registrar estratégia genérica apenas com critérios evidenciados; caso contrário, deixar vazio.
10. Para cada campo vazio, gerar pergunta aberta específica e sem resposta sugerida.

## Nunca

- Inventar mercado, rival, fornecedor, cliente, substituto, barreira ou participação.
- Copiar casos, empresas ou cadeias de valor do livro para a empresa do Daniel.
- Preencher SWOT com definições teóricas ou tendências não citadas.
- Tratar ausência de informação como ausência de pressão competitiva.
- Afirmar liderança em custo por preço baixo, margem isolada ou percepção genérica de eficiência.
- Afirmar diferenciação por “qualidade”, “atendimento” ou “marca” sem critério de compra evidenciado.
- Afirmar enfoque porque a empresa é pequena, regional ou atende poucos clientes.
- Inferir poder de barganha apenas pelo porte aparente de cliente ou fornecedor.
- Chamar concorrente qualquer empresa citada sem disputa pelo mesmo comprador ou necessidade.
- Comparar períodos ou escopos diferentes sem explicitar a incompatibilidade.
- Inventar meta, economia, prêmio de preço ou ganho de participação.
- Afirmar causa-efeito quando a sessão trouxe apenas coexistência de fatos.

## Regras

| id_regra | se | então | evidência exigida | saída quando faltar |
|---|---|---|---|---|
| POR-R-01 | rival e base de disputa forem citados | registrar rivalidade e objeto da disputa | `fala`, `contrato` ou `sessao` | “Quais empresas o cliente compara com vocês e em quais critérios?” |
| POR-R-02 | cliente impuser desconto, prazo, exclusividade ou serviço | registrar hipótese de poder do cliente e efeito | `fala`, `contrato`, `dre` ou `sessao` | “Quando um cliente consegue alterar preço, prazo ou condição de venda?” |
| POR-R-03 | fornecedor impuser condição ou houver dependência | registrar hipótese de poder e insumo afetado | `fala`, `contrato`, `dre` ou `sessao` | “Quais fornecedores impõem preço, prazo, lote ou exclusividade, e por quê?” |
| POR-R-04 | solução alternativa atender à mesma necessidade | registrar substituição e testar valor/preço e troca | `fala`, `contrato` ou `sessao` | “Que outra solução o cliente usa para resolver o mesmo problema?” |
| POR-R-05 | entrante for citado | registrar ameaça de entrada e barreira observada | `fala`, `contrato` ou `sessao` | “Quem pode começar a disputar esses clientes, e o que dificulta a entrada?” |
| POR-R-06 | houver preço baixo sem prova de custo relativo | registrar posicionamento de preço, não liderança em custo | `fala`, `dre` ou `sessao` | “Quais atividades ou contas permitem custo menor que o dos rivais comparáveis?” |
| POR-R-07 | houver custo e comparação de mesmo escopo | registrar hipótese de vantagem ou desvantagem de custo | `dre` mais `fala` ou `sessao` | “Com qual rival ou alternativa esse custo é comparado e no mesmo período?” |
| POR-R-08 | atributo distinto estiver ligado à escolha ou valor | registrar hipótese de diferenciação | `fala`, `contrato` ou `sessao` | “O que o cliente reconhece como diferente e como isso altera sua escolha, custo ou desempenho?” |
| POR-R-09 | atributo não tiver efeito comprovado para o comprador | registrar atributo, não diferenciação | `fala`, `contrato` ou `sessao` | “Que evidência mostra que esse atributo pesa na compra ou justifica preço?” |
| POR-R-10 | segmento escolhido tiver necessidade distinta | testar enfoque dentro do segmento | `fala`, `contrato` ou `sessao` | “Qual segmento foi escolhido e o que nele exige oferta diferente?” |
| POR-R-11 | houver apenas concentração acidental em poucos clientes | registrar concentração, não enfoque | `fala`, `contrato` ou `sessao` | “Essa concentração é escolha estratégica ou resultado das vendas atuais?” |
| POR-R-12 | atividade interna reduzir custo ou elevar valor | candidatar a força na SWOT | `fala`, `dre`, `contrato`, `organograma` ou `sessao` | “Qual atividade produz essa vantagem e qual efeito foi observado?” |
| POR-R-13 | atividade interna elevar custo, atrasar ou reduzir valor | candidatar a fraqueza na SWOT | `fala`, `dre`, `contrato`, `organograma` ou `sessao` | “Qual atividade limita preço, margem, prazo ou valor ao cliente?” |
| POR-R-14 | mudança externa trouxer benefício possível e agente identificado | candidatar a oportunidade | `fala`, `contrato` ou `sessao` | “Que mudança externa pode beneficiar a empresa, por qual mecanismo?” |
| POR-R-15 | pressão externa trouxer perda possível e agente identificado | candidatar a ameaça | `fala`, `contrato` ou `sessao` | “Que agente externo pode reduzir vendas, margem ou acesso ao cliente, e como?” |
| POR-R-16 | substituto for citado | avaliar valor/preço, custo de troca e propensão | `fala`, `contrato` ou `sessao` | “Ao trocar, o cliente ganha o quê, paga o quê e enfrenta quais riscos?” |
| POR-R-17 | cadeia de valor for descrita | manter só atividades reais e elos evidenciados | `fala`, `dre`, `contrato`, `organograma` ou `sessao` | “Quais atividades entregam a oferta e onde afetam custo ou valor?” |
| POR-R-18 | duas ocorrências forem tratadas como causa e efeito | registrar somente hipótese explicitamente dita | `fala` ou `sessao` | “Qual ligação foi proposta e que evidência a sustenta?” |
| POR-R-19 | períodos ou escopos forem incompatíveis | bloquear conclusão competitiva | `dre`, `contrato` ou `sessao` | “Quais dados do mesmo período e escopo permitem comparar?” |
| POR-R-20 | faltar evidência para força, SWOT ou estratégia | deixar campo vazio e emitir pergunta aberta | ausência registrada na `sessao` | pergunta específica correspondente, sem sugerir resposta |

## Perguntas em aberto

- Quais concorrentes aparecem nas negociações e em qual critério o cliente os compara?
- O que faz a empresa ganhar ou perder uma venda: preço, prazo, canal, serviço, funcionalidade ou outro critério citado?
- Quais clientes concentram vendas ou alteram condições comerciais? Que condição alteram?
- Quais fornecedores ou insumos não têm alternativa prática? O que aconteceria numa troca?
- Que solução diferente atende à mesma necessidade do cliente?
- Quem entrou ou pode entrar nesse mercado, e qual barreira concreta enfrenta?
- Que atividade ou conta sustenta custo menor ou maior, comparada a quê e em qual período?
- Qual atributo o cliente valoriza, e que fala, contrato ou compra demonstra isso?
- Existe segmento escolhido deliberadamente? O que exige uma oferta diferente nele?
- Qual fato interno produz força ou fraqueza e qual efeito comprovado possui?
- Qual fato externo cria oportunidade ou ameaça, quem o provoca e qual impacto esperado?
- Para cada causa alegada, qual hipótese foi dita e qual evidência pode confirmá-la?
