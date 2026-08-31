import type { DiagnosticPayload } from "@orbe/shared";

const PEOPLE = /equipe|s[oó]cio|depend[eê]ncia|pessoal|cargo|organograma|rh|colaborador|sucess[aã]o|m[aã]o de obra/i;

function gutLooksLikePeople(payload?: DiagnosticPayload | null) {
  const items = [
    ...(payload?.gut ?? []).map((row) => row.item),
    payload?.ishikawa?.problema,
    ...(payload?.ishikawa?.maoDeObra ?? []),
  ]
    .filter(Boolean)
    .join(" ");
  return PEOPLE.test(items);
}

/** Chiavenato — GUT de gente vira pergunta de cargo/sucessor, nao score de pessoa. */
export function collectPeopleQuestions(payload?: DiagnosticPayload | null): string[] {
  if (!gutLooksLikePeople(payload)) return [];
  const top = payload?.gut?.[0]?.item;
  return [
    top
      ? `Qual cargo responde formalmente pelo processo ligado a “${top}”?`
      : "Qual cargo responde formalmente pelo processo critico apontado na GUT?",
    "Esse cargo consta do organograma? Quem o ocupa hoje?",
    "O que acontece com o processo quando essa pessoa se ausenta?",
    "Existe sucessor identificado? Se nao, confirmar: sem sucessor identificado.",
  ];
}

export function formatChiavenatoForPrompt(payload?: DiagnosticPayload | null) {
  const active = gutLooksLikePeople(payload);
  return [
    "CHIAVENATO (processo_critico): cargo, papel, dono, competencia evidenciada, sucessor ou ausencia expressa.",
    active
      ? "GUT/Ishikawa apontou gente — perguntar organograma e sucessor. Nao pontuar pessoa."
      : "Sem alerta de equipe na GUT — nao inventar diagnostico de RH.",
    "Dependencia so com fala ou organograma. Nao copiar cargo do livro. Nao presumir sucessor pelo subordinado.",
  ].join("\n");
}
