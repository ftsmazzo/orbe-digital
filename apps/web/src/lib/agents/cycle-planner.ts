import { PERSPECTIVES, type Perspective } from "@orbe/shared";
import { completeJson } from "@/lib/ai/claude";

export type CycleKpi = {
  name: string;
  unit: string;
  direction: "aumentar" | "diminuir";
  planned: Record<string, number | null>;
  missing?: string;
};

export type CycleAction = {
  title: string;
  how: string;
  ownerName: string;
  sector: string;
};

export type CycleGoal = {
  perspective: Perspective;
  title: string;
  notes: string;
  kpis: CycleKpi[];
  actions: CycleAction[];
};

export type CyclePlan = {
  goals: CycleGoal[];
  missing: string[];
  openQuestions: string[];
};

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
}): Promise<CyclePlan> {
  const raw = await completeJson<{
    goals?: {
      perspective?: string;
      title?: string;
      notes?: string;
      kpis?: { name?: string; unit?: string; direction?: string; planned?: Record<string, number | null>; missing?: string }[];
      actions?: { title?: string; how?: string; ownerName?: string; sector?: string }[];
    }[];
    missing?: string[];
    openQuestions?: string[];
  }>({
    system: `Voce e o Planejador ORBE. Metodo: O diagnosticado, R metas nas 4 perspectivas BSC (financeira, clientes, processos, aprendizagem), B planos de acao com dono e como.
NUNCA invente numero de DRE, margem ou faturamento que nao esteja no diagnostico. Se faltar dado, deixe planned vazio e liste em missing.
Responda SOMENTE JSON.`,
    user: `Cliente: ${opts.clientName}
Setor: ${opts.sector ?? "nao informado"}

Diagnostico consolidado:
${opts.diagnosticJson.slice(0, 14000)}

Pesquisa de mercado (se houver):
${(opts.marketSummary ?? "(ainda sem Apify)").slice(0, 3000)}

Principios:
${(opts.knowledge ?? "").slice(0, 2500)}

Retorne exatamente 4 goals, um por perspectiva:
{
  "goals": [
    {
      "perspective": "financeira|clientes|processos|aprendizagem",
      "title": "meta anual",
      "notes": "causa-efeito BSC",
      "kpis": [{ "name": "", "unit": "percentual|numero|moeda", "direction": "aumentar|diminuir", "planned": {"01": null}, "missing": "o que falta para numerar" }],
      "actions": [{ "title": "", "how": "passo concreto", "ownerName": "papel", "sector": "area" }]
    }
  ],
  "missing": ["o que o consultor precisa obter"],
  "openQuestions": []
}`,
    maxTokens: 5000,
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

  return {
    goals: PERSPECTIVES.map((perspective) => byPerspective.get(perspective)!),
    missing: Array.isArray(raw.missing) ? raw.missing.map(String) : [],
    openQuestions: Array.isArray(raw.openQuestions) ? raw.openQuestions.map(String) : [],
  };
}
