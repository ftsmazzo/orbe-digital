import { PERSPECTIVES, type Perspective } from "@orbe/shared";
import type { CycleAction, CycleGoal, CyclePlan } from "@/lib/agents/cycle-types";
import type { DreBrief } from "@/lib/agents/tools/leitor-dre";

export const GLOBAL_NOTE_PREFIX = "[global]";

function emptyMonths(): Record<string, number | null> {
  return Object.fromEntries(Array.from({ length: 12 }, (_, i) => [String(i + 1).padStart(2, "0"), null]));
}

function asPerspective(value: string): Perspective {
  const mapped: Record<string, Perspective> = {
    financeira: "financeira",
    comercial: "clientes",
    clientes: "clientes",
    processos: "processos",
    "processos internos": "processos",
    recursos: "aprendizagem",
    aprendizagem: "aprendizagem",
  };
  return mapped[value.toLowerCase()] ?? ((PERSPECTIVES as readonly string[]).includes(value) ? (value as Perspective) : "financeira");
}

function stripInventedPlanned(planned: Record<string, number | null> | undefined, allow: boolean) {
  const months = emptyMonths();
  if (!allow || !planned) return months;
  for (const [key, value] of Object.entries(planned)) {
    if (key in months && typeof value === "number" && Number.isFinite(value)) months[key] = value;
  }
  return months;
}

function format5w2h(action: CycleAction, fallbackOwner: string): CycleAction {
  const how = action.how?.trim() ?? "";
  const already = /o que:|por que:|quem:/i.test(how);
  const owner = action.ownerName?.trim() || fallbackOwner;
  if (already) {
    return { ...action, ownerName: owner || "A definir" };
  }
  const block = [
    `O que: ${action.title}`,
    `Por que: ${how || "Fechar lacuna da meta desta perspectiva."}`,
    `Quem: ${owner || "A definir — perguntar na proxima sessao."}`,
    `Quando: a definir com o consultor (nao inventar prazo).`,
    `Onde: ${action.sector || "area da perspectiva"}`,
    `Como: ${how || "Detalhar na reuniao de implantacao."}`,
    `Quanto: sem evidencia — nao inventar.`,
  ].join("\n");
  return { ...action, how: block, ownerName: owner || "A definir" };
}

export function enforceMapaBsc(plan: CyclePlan, dre: DreBrief): CyclePlan {
  const missing = [...plan.missing];
  const openQuestions = [...plan.openQuestions];

  if (!dre.allowPlannedNumbers) {
    missing.push("Sem DRE nem numero na sessao: KPIs ficam sem meta numerica.");
  }

  const byPerspective = new Map<Perspective, CycleGoal>();
  for (const item of plan.goals) {
    const perspective = asPerspective(item.perspective);
    const kpis = (item.kpis.length ? item.kpis : [{ name: `KPI ${perspective}`, unit: "numero", direction: "aumentar" as const, planned: emptyMonths() }]).map(
      (kpi) => {
        const planned = stripInventedPlanned(kpi.planned, dre.allowPlannedNumbers);
        const hasNumber = Object.values(planned).some((value) => value != null);
        return {
          ...kpi,
          planned,
          missing: hasNumber ? kpi.missing : kpi.missing || "Falta evidencia numerica (DRE ou sessao).",
        };
      },
    );
    if (!item.notes.toLowerCase().includes("se") && !item.notes.toLowerCase().includes("causa")) {
      missing.push(`Perspectiva ${perspective}: falta hipotese de causa-efeito explicita.`);
    }
    if (kpis.every((kpi) => !kpi.name.trim())) {
      missing.push(`Perspectiva ${perspective}: objetivo sem indicador — mapa nao fecha.`);
    }
    const actions = (item.actions.length ? item.actions : []).map((action) => format5w2h(action, action.ownerName));
    if (!actions.length) {
      actions.push(
        format5w2h(
          {
            title: `Definir dono e ritual — ${perspective}`,
            how: "Perguntar quem responde por este bloco.",
            ownerName: "A definir",
            sector: perspective,
          },
          "A definir",
        ),
      );
      openQuestions.push(`Quem e o dono da perspectiva ${perspective}?`);
    }
    for (const action of actions) {
      if (!action.ownerName || action.ownerName.toLowerCase().includes("definir")) {
        openQuestions.push(`Quem responde pela acao “${action.title}”?`);
      }
    }
    byPerspective.set(perspective, { ...item, perspective, kpis, actions });
  }

  for (const perspective of PERSPECTIVES) {
    if (!byPerspective.has(perspective)) {
      byPerspective.set(perspective, {
        perspective,
        title: `Estruturar perspectiva ${perspective}`,
        notes: "Completar o BSC. Falta evidencia na conversa para a hipotese causal.",
        kpis: [{ name: `Indicador ${perspective}`, unit: "numero", direction: "aumentar", planned: emptyMonths(), missing: "Sem base numerica." }],
        actions: [
          format5w2h(
            {
              title: `Definir dono da perspectiva ${perspective}`,
              how: "Obter na proxima sessao.",
              ownerName: "A definir",
              sector: perspective,
            },
            "A definir",
          ),
        ],
      });
      missing.push(`Faltou a perspectiva ${perspective} na geracao — placeholder sem numero.`);
    }
  }

  const globals = (plan.globals ?? [])
    .map((item) => ({
      title: String(item.title ?? "").slice(0, 180),
      notes: item.notes,
    }))
    .filter((item) => item.title)
    .slice(0, 6);

  if (globals.length < 6) {
    missing.push(`Metas globais: ${globals.length} de 6. Completar com o que a sessao sustentou; nao inventar as que faltam.`);
    openQuestions.push("Quais sao as metas globais desta empresa (ate 6)?");
  }

  return {
    globals,
    goals: PERSPECTIVES.map((perspective) => byPerspective.get(perspective)!),
    missing: [...new Set(missing)],
    openQuestions: [...new Set(openQuestions)],
    challenges: plan.challenges ?? [],
  };
}
