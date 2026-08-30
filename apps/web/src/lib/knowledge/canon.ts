import type { Perspective } from "@orbe/shared";

export type PrincipleCard = {
  id: string;
  title: string;
  author: string;
  area: Perspective | "principios" | "capital";
  weight: number;
  thesis: string;
  apply: string;
  never: string;
};

/** Fichas curadas (nao substituem o livro). Hill e Kaplan tem peso maior. */
export const PRINCIPLE_CARDS: PrincipleCard[] = [
  {
    id: "hill",
    title: "Think and Grow Rich / O Manuscrito",
    author: "Napoleon Hill",
    area: "principios",
    weight: 3,
    thesis: "Desejo definido, fe aplicada e persistencia organizam a acao. O consultor conduz clareza de objetivo antes de ferramenta.",
    apply: "Abertura da reuniao estrategica, metas do cliente, disciplina de execucao.",
    never: "Nao inventar numeros nem prometer resultado financeiro. Clareza de objetivo antes de ferramenta.",
  },
  {
    id: "daniel-playbook",
    title: "Playbook falado — CEO terceirizado",
    author: "Daniel Herculis",
    area: "principios",
    weight: 2,
    thesis: "Reuniao de entrada, alinhamento com o orquestrador, diagnostico editavel, 6 metas globais, 4 perspectivas, 5W2H e acompanhamento. O sistema pode contrariar o consultor se nao for estrategico.",
    apply: "Operar o ciclo; preservar auditoria do que saiu da tela; lingua: comercial e recursos.",
    never: "Nao apagar historico. Nao inventar valor de meta. Nao concordar por educacao.",
  },
  {
    id: "daniel-vendas",
    title: "Metodologia de vendas — reuniao estrategica",
    author: "Daniel Herculis",
    area: "principios",
    weight: 2,
    thesis:
      "Conversa com perguntas, nao formulario. Depois da reuniao o sistema sugere cliente ideal ou problema; o consultor decide admitir.",
    apply: "Roteiro da planilha + filtro dos cinco eixos na transcricao da sessao estrategica.",
    never: "Nao aceitar quem nao se respeita intelectualmente. Nao inventar fit sem evidencia. Nao disputar preco.",
  },
  {
    id: "bsc",
    title: "A Estrategia em Acao (Balanced Scorecard)",
    author: "Kaplan & Norton",
    area: "financeira",
    weight: 2,
    thesis: "Estrategia vira metas e indicadores nas 4 perspectivas: financeira, clientes, processos, aprendizagem.",
    apply: "Diagnostico O, planejamento R, dashboard E.",
    never: "Nao criar KPI sem meta e dono. Nao lista generica de indicadores. Nao inventar numero.",
  },
  {
    id: "mapas",
    title: "Mapas Estrategicos",
    author: "Kaplan & Norton",
    area: "processos",
    weight: 2,
    thesis: "Relacoes de causa e efeito: aprendizagem -> processos -> clientes -> financeiro.",
    apply: "Mapa BSC e priorizacao de PAs.",
    never: "Nao tratar perspectivas como silos isolados.",
  },
  {
    id: "fipecafi",
    title: "Manual de Contabilidade Societaria",
    author: "Fipecafi",
    area: "financeira",
    weight: 1,
    thesis: "Demonstracoes seguem CPC/NBC. EBITDA e metrica gerencial derivada da DRE, nao substitui lucro contabil.",
    apply: "Honorarios 15% EBITDA, valuation, diagnostico financeiro.",
    never: "Nao misturar regime de caixa com competencia sem declarar.",
  },
  {
    id: "porter",
    title: "Vantagem Competitiva",
    author: "Michael Porter",
    area: "clientes",
    weight: 1,
    thesis: "Posicao competitiva vem de custo, diferenciacao ou enfoque — nao de copiar concorrente.",
    apply: "SWOT, pesquisa R, proposta de valor.",
    never: "Nao afirmar posicao de mercado sem evidencia.",
  },
  {
    id: "outsiders",
    title: "The Outsiders",
    author: "William Thorndike",
    area: "capital",
    weight: 1,
    thesis: "CEO excepcional aloca capital com disciplina (investir, recomprar, dividendo, aquisicao).",
    apply: "Decisoes de caixa, valuation, ciclo E.",
    never: "Nao recomendar alavancagem sem DRE real.",
  },
  {
    id: "martins",
    title: "Contabilidade de Custos",
    author: "Eliseu Martins",
    area: "financeira",
    weight: 1,
    thesis: "Custo direto vs indireto, CMV e margem definem preco e ponto de equilibrio.",
    apply: "Folha light, capital de giro, DRE.",
    never: "Nao usar custo padrao inventado. CPV nao e custo produzido se houver estoque. Nao matar produto pelo lucro apos rateio.",
  },
  {
    id: "controladoria",
    title: "Controladoria, analise financeira e orcamento",
    author: "Fauzi Timaco Jorge / Antonio Salvador Morante",
    area: "financeira",
    weight: 1,
    thesis: "Orcamento e controle fecham o ciclo planejado x realizado.",
    apply: "Indicadores mensais e reuniao E.",
    never: "Nao cobrar meta sem cadencia de apuracao.",
  },
  {
    id: "assaf",
    title: "Estrutura e Analise de Balancos",
    author: "Assaf Neto",
    area: "financeira",
    weight: 1,
    thesis: "Liquidez, endividamento e rentabilidade leem a saude da empresa.",
    apply: "Diagnostico financeiro e NCG.",
    never: "Nao concluir insolvencia com um unico indice.",
  },
  {
    id: "alexander",
    title: "Financial Planning, Analysis and Performance Management",
    author: "Jack Alexander",
    area: "financeira",
    weight: 1,
    thesis: "FP&A liga forecast, driver e performance — nao so o passado.",
    apply: "Valuation 12 meses e dashboard.",
    never: "Nao tratar projecao como garantia (obrigacao de meio).",
  },
  {
    id: "kotler",
    title: "Administracao de Marketing",
    author: "Kotler & Keller",
    area: "clientes",
    weight: 1,
    thesis: "Valor percebido, segmento e mix (4P/7P) organizam o comercial.",
    apply: "Diagnostico comercial e PAs de marketing.",
    never: "Nao copiar campanha sem posicionamento.",
  },
  {
    id: "ries",
    title: "Posicionamento",
    author: "Al Ries & Jack Trout",
    area: "clientes",
    weight: 1,
    thesis: "Posicionar e ocupar um lugar na mente, nao listar atributos.",
    apply: "Reuniao estrategica e proposta.",
    never: "Nao posicionar o metodo ORBE como milagre financeiro.",
  },
  {
    id: "mkt50",
    title: "Marketing 5.0",
    author: "Philip Kotler et al.",
    area: "clientes",
    weight: 1,
    thesis: "Tecnologia a servico de humanidade — dados sem empatia nao convertem.",
    apply: "Canais digitais no diagnostico comercial.",
    never: "Nao sugerir stack de ads sem evidencia de caixa.",
  },
  {
    id: "berger",
    title: "Contagio",
    author: "Jonah Berger",
    area: "clientes",
    weight: 1,
    thesis: "Ideias pegam por moeda social, gatilhos, emocao, visibilidade, valor pratico e historia.",
    apply: "Materiais comerciais e narrativa da proposta.",
    never: "Nao fabricar case de cliente.",
  },
  {
    id: "urdan",
    title: "Gestao do composto de marketing",
    author: "Flavio Urdan & Andre Torres Urdan",
    area: "clientes",
    weight: 1,
    thesis: "Composto precisa ser coerente: produto, preco, praca, promocao.",
    apply: "PAs comerciais.",
    never: "Nao desconectar preco da politica do consultor.",
  },
  {
    id: "chiavenato",
    title: "Gestao de pessoas",
    author: "Idalberto Chiavenato",
    area: "aprendizagem",
    weight: 1,
    thesis: "RH moderno atrai, desenvolve e retém; cargo e salario sustentam processo.",
    apply: "Folha light, equipes, perspectiva aprendizagem.",
    never: "Nao emitir folha trabalhista oficial.",
  },
  {
    id: "drucker",
    title: "O gestor eficaz",
    author: "Peter Drucker",
    area: "aprendizagem",
    weight: 1,
    thesis: "Eficacia e fazer as coisas certas; tempo e prioridade sao o recurso do dirigente.",
    apply: "Filtro de cliente e rotina de diretoria.",
    never: "Nao lotar PA sem dono.",
  },
  {
    id: "robbins",
    title: "Desperte seu gigante interior / Poder sem limites",
    author: "Tony Robbins",
    area: "principios",
    weight: 1,
    thesis: "Estado interno e padrao de pergunta mudam a qualidade da decisao.",
    apply: "Conducao da conversa estrategica (quem fala e o cliente).",
    never: "Nao virar sessao de coaching pessoal no diagnostico financeiro.",
  },
  {
    id: "weske",
    title: "Business Process Management",
    author: "Mathias Weske",
    area: "processos",
    weight: 1,
    thesis: "Processo tem dono, evento, atividade e indicador — senao e achismo.",
    apply: "Mapeamento da fase B.",
    never: "Nao desenhar BPMN so para enfeitar relatorio.",
  },
  {
    id: "hammer",
    title: "Reengenharia",
    author: "Michael Hammer",
    area: "processos",
    weight: 1,
    thesis: "As vezes o processo deve ser redesenhado, nao otimizado no erro.",
    apply: "Gargalos operacionais graves.",
    never: "Nao recomendar demissao em massa sem dados.",
  },
  {
    id: "liker",
    title: "O Modelo Toyota",
    author: "Jeffrey Liker",
    area: "processos",
    weight: 1,
    thesis: "Fluxo, desperdicio e respeito pelas pessoas.",
    apply: "Operacao e cadencia de PAs.",
    never: "Nao copiar lean de fabrica em servico sem adaptar.",
  },
  {
    id: "scrum",
    title: "Scrum",
    author: "Jeff Sutherland",
    area: "processos",
    weight: 1,
    thesis: "Ciclos curtos, inspect and adapt.",
    apply: "Reunioes E mensais e sprints de PA.",
    never: "Nao virar o cliente em time de software.",
  },
  {
    id: "sfo",
    title: "A Organizacao Orientada para a Estrategia",
    author: "Kaplan & Norton",
    area: "financeira",
    weight: 2,
    thesis: "O BSC so funciona com donos, rotina de revisao e alinhamento da equipe.",
    apply: "Cadencia mensal E e ritual de metas.",
    never: "Nao deixar KPI orfao sem responsavel.",
  },
  {
    id: "keller",
    title: "Administracao de Marketing",
    author: "Kotler & Keller",
    area: "clientes",
    weight: 1,
    thesis: "Valor percebido, mix e posicionamento sustentam precificacao.",
    apply: "Proposta comercial e filtro de cliente.",
    never: "Nao inventar TAM/SAM/SOM.",
  },
  {
    id: "mercado-br",
    title: "Marketing no contexto brasileiro",
    author: "Urdan & Urdan",
    area: "clientes",
    weight: 1,
    thesis: "Contexto brasileiro muda canal, preco e relacionamento.",
    apply: "Pesquisa R regional e abordagem de fechamento.",
    never: "Nao copiar case internacional sem adaptar.",
  },
];

export function cardsForQuery(query: string, perspective?: Perspective, limit = 6): PrincipleCard[] {
  const q = query.toLowerCase();
  const scored = PRINCIPLE_CARDS.map((card) => {
    const hay = `${card.title} ${card.author} ${card.thesis} ${card.apply} ${card.area}`.toLowerCase();
    let score = card.weight;
    for (const token of q.split(/\s+/).filter((t) => t.length > 3)) {
      if (hay.includes(token)) score += 1.5;
    }
    if (perspective && card.area === perspective) score += 1.5;
    return { card, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.card);
}

export function formatCardsForPrompt(cards: PrincipleCard[]) {
  return cards
    .map(
      (c) =>
        `[${c.author} — ${c.title} | peso ${c.weight}]\nTese: ${c.thesis}\nAplicar: ${c.apply}\nNunca: ${c.never}`,
    )
    .join("\n\n");
}
