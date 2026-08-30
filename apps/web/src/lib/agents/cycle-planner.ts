import { PERSPECTIVES, type DiagnosticPayload, type Perspective } from "@orbe/shared";
import { completeJson } from "@/lib/ai/claude";
import type { CycleGoal, CyclePlan } from "@/lib/agents/cycle-types";
import { enforceMapaBsc } from "@/lib/agents/tools/mapa-bsc";
import { formatMethodForPrompt } from "@/lib/agents/tools/method-canon";
import { formatDreBrief, type DreBrief } from "@/lib/agents/tools/leitor-dre";
import { formatMatrizesForPrompt } from "@/lib/agents/tools/matrizes";

export type { CycleAction, CycleGlobal, CycleGoal, CycleKpi, CyclePlan } from "@/lib/agents/cycle-types";

function emptyMonths(): Record<string, number | null> {
  return Object.fromEntries(Array.from({ length: 12 }, (_, i) => [String(i + 1).padStart(2, "0"), null]));
}

function asPerspective(value: string): Perspective {
  return (PERSPECTIVES as readonly string[]).includes(value) ? (value as Perspective) : "financeira";
}

export async function planOrbeCycle(opts: {
  clientName: string;
  sector?: string | null;
  diagnosticJson: string;
  marketSummary?: string;
  knowledge?: string;
  dre?: DreBrief;
}): Promise<CyclePlan> {
  const dre = opts.dre ?? {
    hasDreDocument: false,
    hasSessionNumbers: false,
    allowPlannedNumbers: false,
    notes: [],
    gates: [],
  };
  let diagnosticPayload: DiagnosticPayload | undefined;
  try {
    diagnosticPayload = JSON.parse(opts.diagnosticJson).payload;
  } catch {
    diagnosticPayload = undefined;
  }
  const raw = await completeJson<{
    globals?: { title?: string; notes?: string }[];
    goals?: {
      perspective?: string;
      title?: string;
      notes?: string;
      kpis?: { name?: string; unit?: string; direction?: string; planned?: Record<string, number | null>; missing?: string }[];
      actions?: { title?: string; how?: string; ownerName?: string; sector?: string }[];
    }[];
    missing?: string[];
    openQuestions?: string[];
    challenges?: string[];
  }>({
    system: `Voce e o Planejador ORBE. Obedeça o metodo compilado. Pode contrariar o consultor se a opiniao nao for estrategica.
NUNCA invente numero. Se faltar DRE, planned fica vazio.
Responda SOMENTE um objeto JSON valido. Feche todas as chaves. Sem markdown.

${formatMethodForPrompt()}`,
    user: `Cliente: ${opts.clientName}
Setor: ${opts.sector ?? "nao informado"}

${formatDreBrief(dre)}

${formatMatrizesForPrompt(diagnosticPayload)}

Diagnostico consolidado:
${opts.diagnosticJson.slice(0, 14000)}

Pesquisa de mercado (se houver):
${(opts.marketSummary ?? "(ainda sem Apify)").slice(0, 3000)}

Principios:
${(opts.knowledge ?? "").slice(0, 2000)}

Retorne:
{
  "globals": [{ "title": "meta global (ate 6, so o que a sessao sustentar)", "notes": "para qual objetivo da empresa" }],
  "goals": [
    {
      "perspective": "financeira|clientes|processos|aprendizagem",
      "title": "meta da perspectiva que colabora com as globais",
      "notes": "hipotese se–entao de causa-efeito",
      "kpis": [{ "name": "", "unit": "percentual|numero|moeda", "direction": "aumentar|diminuir", "planned": {"01": null}, "missing": "o que falta para numerar" }],
      "actions": [{ "title": "", "how": "5W2H resumido", "ownerName": "papel dito na sessao ou A definir", "sector": "area" }]
    }
  ],
  "missing": ["o que falta obter"],
  "openQuestions": [],
  "challenges": ["onde discordar do consultor, se houver, com motivo estrategico"]
}
Exatamente 4 goals, um por perspectiva. Ate 6 globals sem inventar as que faltam.`,
    maxTokens: 8192,
  });

  const byPerspective = new Map<Perspective, CycleGoal>();
  for (const item of raw.goals ?? []) {
    const perspective = asPerspective(String(item.perspective ?? "financeira"));
    const planned = { ...emptyMonths(), ...(item.kpis?.[0]?.planned ?? {}) };
    byPerspective.set(perspective, {
      perspective,
      title: String(item.title ?? `Meta ${perspective}`).slice(0, 180),
      notes: String(item.notes ?? ""),
      kpis: (item.kpis?.length ? item.kpis : [{ name: `KPI ${perspective}` }]).map((kpi) => ({
        name: String(kpi.name ?? `KPI ${perspective}`).slice(0, 80),
        unit: String(kpi.unit ?? "numero"),
        direction: kpi.direction === "diminuir" ? "diminuir" : "aumentar",
        planned: { ...emptyMonths(), ...(kpi.planned ?? {}) },
        missing: kpi.missing,
      })),
      actions: (item.actions ?? []).slice(0, 3).map((action) => ({
        title: String(action.title ?? "Plano de acao").slice(0, 120),
        how: String(action.how ?? "Detalhar com o cliente."),
        ownerName: String(action.ownerName ?? "A definir"),
        sector: String(action.sector ?? perspective),
      })),
    });
  }

  for (const perspective of PERSPECTIVES) {
    if (!byPerspective.has(perspective)) {
      byPerspective.set(perspective, {
        perspective,
        title: `Estruturar perspectiva ${perspective}`,
        notes: "Gerado para completar o BSC. Falta evidencia na conversa.",
        kpis: [{ name: `Indicador ${perspective}`, unit: "numero", direction: "aumentar", planned: emptyMonths(), missing: "Sem base numerica na transcricao." }],
        actions: [
          {
            title: `Definir dono e ritual da perspectiva ${perspective}`,
            how: "Perguntar na proxima sessao quem responde por este bloco.",
            ownerName: "A definir",
            sector: perspective,
          },
        ],
      });
    }
  }

  return enforceMapaBsc(
    {
      globals: (raw.globals ?? []).map((item) => ({
        title: String(item.title ?? "").slice(0, 180),
        notes: String(item.notes ?? ""),
      })),
      goals: PERSPECTIVES.map((perspective) => byPerspective.get(perspective)!),
      missing: Array.isArray(raw.missing) ? raw.missing.map(String) : [],
      openQuestions: Array.isArray(raw.openQuestions) ? raw.openQuestions.map(String) : [],
      challenges: Array.isArray(raw.challenges) ? raw.challenges.map(String) : [],
    },
    dre,
  );
}
