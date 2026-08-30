"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { type DiagnosticPayload, type Perspective } from "@orbe/shared";
import {
  actionItems,
  clientDocuments,
  clients,
  consultingSessions,
  db,
  diagnostics,
  goals,
  indicators,
  marketInsights,
  proposals,
} from "@/lib/db";
import { planOrbeCycle, type CyclePlan } from "@/lib/agents/cycle-planner";
import { readDreBrief } from "@/lib/agents/tools/leitor-dre";
import { GLOBAL_NOTE_PREFIX } from "@/lib/agents/tools/mapa-bsc";
import { extractDiagnosticFromTranscript } from "@/lib/agents/extract";
import { researchMarketEnriched } from "@/lib/agents/market-research-apify";
import { isThinHeuristicPayload, pickBestDiagnostic } from "@/lib/agents/process-status";
import { generateProposalHtml } from "@/lib/agents/proposal";
import { wrapDhDocument } from "@/lib/brand/document";
import { classifyDocument } from "@/lib/documents/classify";
import { extractDocumentText } from "@/lib/documents/ocr";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import { getCurrentOrg } from "@/lib/org";
import { persistFitFromTranscript } from "@/lib/sales/persist-fit";
import { putObject } from "@/lib/storage";

const MAX_UPLOAD_BYTES = 18 * 1024 * 1024;

function operatePaths(clientId: string) {
  revalidatePath(`/app/clients/${clientId}/operate`);
  revalidatePath(`/app/clients/${clientId}`);
}

type CycleRun = {
  status: "idle" | "running" | "done" | "error";
  step?: string;
  error?: string;
  apify?: string;
  startedAt?: string;
  finishedAt?: string;
};

async function loadClient(clientId: string, orgId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)))
    .limit(1);
  return client;
}

function isStaleRun(run?: CycleRun | null) {
  if (run?.status !== "running" || !run.startedAt) return false;
  return Date.now() - new Date(run.startedAt).getTime() > 4 * 60 * 1000;
}

async function setCycleRun(clientId: string, orgId: string, patch: Partial<CycleRun>) {
  const client = await loadClient(clientId, orgId);
  const current = (client?.cycleRun ?? { status: "idle" }) as CycleRun;
  const next: CycleRun = { ...current, ...patch };
  if (patch.status === "running" || patch.status === "done") delete next.error;
  if (patch.status === "running") {
    delete next.finishedAt;
    if (patch.apify === undefined) delete next.apify;
  }
  await db
    .update(clients)
    .set({
      cycleRun: next,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)));
}

export async function uploadClientDocument(clientId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  const client = await loadClient(clientId, orgId);
  if (!client) return;

  const file = formData.get("document");
  const pasted = typeof formData.get("pastedText") === "string" ? String(formData.get("pastedText")).trim() : "";
  const hasFile = file instanceof File && file.size > 0;

  if (!hasFile && !pasted) return;
  if (hasFile && file.size > MAX_UPLOAD_BYTES) return;

  let storageKey: string | undefined;
  const mimeType = hasFile ? file.type || "application/octet-stream" : "text/plain";
  const customTitle = typeof formData.get("title") === "string" ? String(formData.get("title")).trim() : "";
  const title = customTitle || (hasFile ? file.name : "Anotacao colada");
  let extracted = pasted;
  let source = "texto";
  let ocrError: string | undefined;
  let pages = pasted ? 1 : 0;

  if (hasFile) {
    const stored = await putObject(file, "documents");
    storageKey = stored.key;
    const bytes = Buffer.from(await file.arrayBuffer());
    const ocr = await extractDocumentText({ filename: file.name, mimeType, bytes });
    extracted = ocr.text || pasted;
    source = ocr.source;
    ocrError = ocr.error;
    pages = ocr.pages;
  }

  const kind = classifyDocument(title, extracted);
  await db.insert(clientDocuments).values({
    organizationId: orgId,
    clientId,
    title,
    kind,
    mimeType,
    storageKey,
    extractedText: extracted || null,
    status: extracted ? "pronto" : ocrError ? "erro" : "recebido",
    source,
    payload: { pages, error: ocrError ?? null },
  });

  operatePaths(clientId);
}

export async function runOperateAction(clientId: string, formData: FormData): Promise<{ error?: string }> {
  const action = String(formData.get("action") ?? "");
  const { orgId, userId } = await getCurrentOrg();
  const client = await loadClient(clientId, orgId);
  if (!client) return { error: "Cliente nao encontrado." };

  const currentRun = (client.cycleRun ?? { status: "idle" }) as CycleRun;
  if (action === "ciclo" && currentRun.status === "running" && !isStaleRun(currentRun)) {
    return { error: "O ciclo desta empresa ja esta em andamento. Aguarde ou volte nesta tela." };
  }

  try {
    if (action === "ciclo") {
      await setCycleRun(clientId, orgId, {
        status: "running",
        step: "Lendo sessoes e documentos",
        error: undefined,
        apify: undefined,
        startedAt: new Date().toISOString(),
        finishedAt: undefined,
      });
      after(async () => {
        try {
          await orchestrateFullCycle(orgId, clientId, client);
          await setCycleRun(clientId, orgId, {
            status: "done",
            step: "Concluido",
            finishedAt: new Date().toISOString(),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await setCycleRun(clientId, orgId, {
            status: "error",
            error: message,
            finishedAt: new Date().toISOString(),
          });
        }
        operatePaths(clientId);
        revalidatePath("/app/diagnostics");
        revalidatePath(`/app/clients/${clientId}/planning`);
        revalidatePath(`/app/clients/${clientId}/actions`);
        revalidatePath(`/app/clients/${clientId}/dashboard`);
        revalidatePath(`/app/clients/${clientId}/proposals`);
      });
      operatePaths(clientId);
      return {};
    }

    if (action === "sugerir_fit") {
      const sessions = await db
        .select()
        .from(consultingSessions)
        .where(and(eq(consultingSessions.clientId, clientId), eq(consultingSessions.organizationId, orgId)))
        .orderBy(desc(consultingSessions.createdAt));
      const withText = sessions.filter((row) => row.transcriptRaw?.trim());
      const session = withText.find((row) => row.kind === "estrategica") ?? withText[0];
      if (!session?.transcriptRaw?.trim()) {
        return { error: "Nao ha transcricao para ler o fit. Grave a reuniao estrategica." };
      }
      await persistFitFromTranscript({
        orgId,
        clientId,
        sessionId: session.id,
        sessionKind: session.kind,
        transcript: session.transcriptRaw,
        clientName: client.name,
        force: true,
      });
      operatePaths(clientId);
      return {};
    }

    if (action === "diagnosticar") {
      await diagnoseFromCockpit(orgId, clientId, client.name);
    } else if (action === "validar") {
      const rows = await db
        .select()
        .from(diagnostics)
        .where(and(eq(diagnostics.clientId, clientId), eq(diagnostics.organizationId, orgId)))
        .orderBy(desc(diagnostics.createdAt));
      const best = pickBestDiagnostic(rows);
      if (!best) return { error: "Nao ha diagnostico para validar." };
      if (isThinHeuristicPayload((best.payload ?? {}) as DiagnosticPayload)) {
        return { error: "O melhor diagnostico ainda e heuristica. Consolide com o historico antes de validar." };
      }
      if (!best.validated) {
        await db
          .update(diagnostics)
          .set({ validated: true, validatedAt: new Date(), validatedById: userId, updatedAt: new Date() })
          .where(eq(diagnostics.id, best.id));
      }
    } else if (action === "pesquisar") {
      await researchFromCockpit(orgId, clientId, client.name, client.sector, client.city);
    } else if (action === "planejar") {
      await planFromCockpit(orgId, clientId);
    } else if (action === "propor") {
      await proposeFromCockpit(orgId, clientId, client.name);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (action === "ciclo") {
      await setCycleRun(clientId, orgId, {
        status: "error",
        error: message,
        finishedAt: new Date().toISOString(),
      });
    }
    return { error: message };
  }

  operatePaths(clientId);
  revalidatePath("/app/diagnostics");
  revalidatePath(`/app/clients/${clientId}/planning`);
  revalidatePath(`/app/clients/${clientId}/actions`);
  revalidatePath(`/app/clients/${clientId}/dashboard`);
  revalidatePath(`/app/clients/${clientId}/proposals`);
  return {};
}

async function orchestrateFullCycle(
  orgId: string,
  clientId: string,
  client: { name: string; sector?: string | null; city?: string | null },
) {
  const existingDiagnosticRows = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.clientId, clientId), eq(diagnostics.organizationId, orgId)))
    .orderBy(desc(diagnostics.createdAt));
  const existingDiagnostic = pickBestDiagnostic(existingDiagnosticRows);
  const existingIsReal =
    existingDiagnostic && !isThinHeuristicPayload((existingDiagnostic.payload ?? {}) as DiagnosticPayload);

  const [latestSession] = await db
    .select({ updatedAt: consultingSessions.updatedAt })
    .from(consultingSessions)
    .where(and(eq(consultingSessions.clientId, clientId), eq(consultingSessions.organizationId, orgId)))
    .orderBy(desc(consultingSessions.updatedAt))
    .limit(1);
  const [latestDocument] = await db
    .select({ updatedAt: clientDocuments.updatedAt })
    .from(clientDocuments)
    .where(and(eq(clientDocuments.clientId, clientId), eq(clientDocuments.organizationId, orgId)))
    .orderBy(desc(clientDocuments.updatedAt))
    .limit(1);
  const materialAfterDiagnostic = Boolean(
    existingDiagnostic &&
      ((latestSession && latestSession.updatedAt > existingDiagnostic.createdAt) ||
        (latestDocument && latestDocument.updatedAt > existingDiagnostic.createdAt)),
  );

  if (!existingIsReal || materialAfterDiagnostic) {
    await setCycleRun(clientId, orgId, { step: "Diagnosticando com o historico" });
    await diagnoseFromCockpit(orgId, clientId, client.name);
  } else {
    await setCycleRun(clientId, orgId, { step: "Reusando diagnostico ja consolidado" });
  }

  const diagnosticRows = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.clientId, clientId), eq(diagnostics.organizationId, orgId)))
    .orderBy(desc(diagnostics.createdAt));
  const diagnostic = pickBestDiagnostic(diagnosticRows);
  if (!diagnostic || isThinHeuristicPayload((diagnostic.payload ?? {}) as DiagnosticPayload)) {
    throw new Error("Nao consolidei um diagnostico real. Sem isso nao monto metas nem acoes.");
  }

  const [insight] = await db
    .select()
    .from(marketInsights)
    .where(and(eq(marketInsights.clientId, clientId), eq(marketInsights.organizationId, orgId)))
    .orderBy(desc(marketInsights.createdAt))
    .limit(1);
  const insightIsReal = Boolean(
    insight?.summary && /\[(Tavily|Sonar)/i.test(insight.summary),
  );
  if (!insightIsReal) {
    await setCycleRun(clientId, orgId, { step: "Pesquisando mercado" });
    try {
      await researchFromCockpit(orgId, clientId, client.name, client.sector, client.city);
      await setCycleRun(clientId, orgId, { apify: "ok — insight gravado" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await setCycleRun(clientId, orgId, { apify: `nao rodou: ${message}` });
    }
  } else {
    await setCycleRun(clientId, orgId, { apify: "ja havia pesquisa web" });
  }

  const [insightAfter] = await db
    .select()
    .from(marketInsights)
    .where(and(eq(marketInsights.clientId, clientId), eq(marketInsights.organizationId, orgId)))
    .orderBy(desc(marketInsights.createdAt))
    .limit(1);

  await setCycleRun(clientId, orgId, { step: "Montando metas globais, BSC e 5W2H" });
  const docs = await documentContext(orgId, clientId);
  const dre = readDreBrief({
    payload: (diagnostic.payload ?? {}) as DiagnosticPayload,
    documentText: docs,
  });
  const knowledge = await retrieveKnowledge({
    orgId,
    query: `${client.name} planejamento BSC metas acoes ${client.sector ?? ""}`,
  });
  const cycle = await planOrbeCycle({
    clientName: client.name,
    sector: client.sector,
    diagnosticJson: JSON.stringify({
      payload: diagnostic.payload,
      gaps: diagnostic.gaps,
      priorities: diagnostic.priorities,
      risks: diagnostic.risks,
      openQuestions: diagnostic.openQuestions,
    }),
    marketSummary: insightAfter?.summary,
    knowledge,
    dre,
  });

  await persistCyclePlan(orgId, clientId, cycle);
  await setCycleRun(clientId, orgId, { step: "Gerando proposta" });
  await proposeFromCockpit(orgId, clientId, client.name);
}

async function documentContext(orgId: string, clientId: string) {
  const docs = await db
    .select()
    .from(clientDocuments)
    .where(and(eq(clientDocuments.clientId, clientId), eq(clientDocuments.organizationId, orgId)))
    .orderBy(desc(clientDocuments.createdAt))
    .limit(6);
  return docs
    .filter((doc) => doc.extractedText)
    .map((doc) => `[Documento ${doc.kind}: ${doc.title}]\n${doc.extractedText!.slice(0, 2500)}`)
    .join("\n\n");
}

async function diagnoseFromCockpit(orgId: string, clientId: string, clientName: string) {
  const sessions = await db
    .select()
    .from(consultingSessions)
    .where(and(eq(consultingSessions.clientId, clientId), eq(consultingSessions.organizationId, orgId)))
    .orderBy(desc(consultingSessions.createdAt));

  const transcripts = sessions
    .filter((session) => session.transcriptRaw?.trim())
    .map((session) => `### ${session.title} (${session.status})\n${session.transcriptRaw!.trim()}`);
  const docs = await documentContext(orgId, clientId);
  const transcript = [...transcripts, docs].filter(Boolean).join("\n\n");
  if (!transcript.trim()) {
    throw new Error("Nao ha transcricao pronta nem documento nesta empresa.");
  }

  const knowledge = await retrieveKnowledge({ orgId, query: `${clientName} ${transcript.slice(0, 1500)}` });
  const extracted = await extractDiagnosticFromTranscript(transcript, clientName, knowledge, {
    allowHeuristic: false,
  });
  if (extracted.source === "heuristic") {
    throw new Error("Recusei gravar heuristica. Configure OPENROUTER_API_KEY e tente de novo.");
  }

  const existingRows = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.clientId, clientId), eq(diagnostics.organizationId, orgId)))
    .orderBy(desc(diagnostics.createdAt));
  const best = pickBestDiagnostic(existingRows);
  const latestSessionWithText = sessions.find((session) => session.transcriptRaw?.trim());

  const maxVersion = existingRows.reduce((max, row) => Math.max(max, row.version ?? 1), 0);
  await db.insert(diagnostics).values({
    organizationId: orgId,
    clientId,
    sessionId: latestSessionWithText?.id ?? best?.sessionId,
    payload: {
      ...extracted.payload,
      audit: {
        previousId: best?.id ?? null,
        keptPrevious: Boolean(best),
        reason: "ciclo — versao anterior permanece para auditoria com o cliente",
      },
    },
    maturity: extracted.maturity,
    gaps: extracted.gaps,
    priorities: extracted.priorities,
    risks: extracted.risks,
    openQuestions: extracted.openQuestions,
    version: maxVersion + 1,
  });
}

async function researchFromCockpit(
  orgId: string,
  clientId: string,
  clientName: string,
  sector?: string | null,
  city?: string | null,
) {
  const knowledge = await retrieveKnowledge({
    orgId,
    query: `${clientName} ${sector ?? ""} mercado regional`,
  });
  const research = await researchMarketEnriched({
    clientName,
    sector: sector ?? undefined,
    city: city ?? undefined,
    scope: "regional",
    region: city ?? undefined,
    knowledge,
  });
  const tag = research.source === "tavily+llm" ? "Tavily+LLM" : "Sonar+LLM";
  await db.insert(marketInsights).values({
    organizationId: orgId,
    clientId,
    scope: research.scope,
    region: research.region,
    sector: research.sector,
    summary: `[${tag}] ${research.summary}`,
    payload: research.payload,
  });
}

async function persistCyclePlan(orgId: string, clientId: string, cycle: CyclePlan) {
  const year = new Date().getFullYear();
  const [existingGoals, existingIndicators, existingActions] = await Promise.all([
    db.select().from(goals).where(and(eq(goals.clientId, clientId), eq(goals.organizationId, orgId))),
    db.select().from(indicators).where(and(eq(indicators.clientId, clientId), eq(indicators.organizationId, orgId))),
    db.select().from(actionItems).where(and(eq(actionItems.clientId, clientId), eq(actionItems.organizationId, orgId))),
  ]);

  const indicatorByPerspective = new Map<Perspective, (typeof existingIndicators)[number]>();
  for (const row of existingIndicators) {
    if (!indicatorByPerspective.has(row.perspective as Perspective)) {
      indicatorByPerspective.set(row.perspective as Perspective, row);
    }
  }

  const unusedGoals = existingGoals.filter(
    (goal) =>
      !goal.notes?.startsWith(GLOBAL_NOTE_PREFIX) && !existingIndicators.some((row) => row.goalId === goal.id),
  );

  const existingGlobals = existingGoals.filter((goal) => goal.notes?.startsWith(GLOBAL_NOTE_PREFIX));
  for (const global of cycle.globals ?? []) {
    if (existingGlobals.length >= 6) break;
    if (existingGlobals.some((row) => row.title.toLowerCase() === global.title.toLowerCase())) continue;
    const challenge = (cycle.challenges ?? []).slice(0, 2).join(" ");
    const [created] = await db
      .insert(goals)
      .values({
        organizationId: orgId,
        clientId,
        title: global.title,
        notes: [`${GLOBAL_NOTE_PREFIX} ${global.notes}`, challenge].filter(Boolean).join("\n") || GLOBAL_NOTE_PREFIX,
        year,
      })
      .returning();
    existingGlobals.push(created);
  }

  for (const planned of cycle.goals) {
    const existingIndicator = indicatorByPerspective.get(planned.perspective);
    let goalId = existingIndicator?.goalId ?? unusedGoals.shift()?.id;
    let indicatorId = existingIndicator?.id;

    if (!goalId) {
      const [goal] = await db
        .insert(goals)
        .values({
          organizationId: orgId,
          clientId,
          title: planned.title,
          notes: [planned.notes, ...cycle.missing.slice(0, 3)].filter(Boolean).join("\n") || null,
          year,
        })
        .returning();
      goalId = goal.id;
    } else if (!existingIndicator) {
      await db
        .update(goals)
        .set({
          title: planned.title,
          notes: [planned.notes, ...cycle.missing.slice(0, 3)].filter(Boolean).join("\n") || null,
        })
        .where(eq(goals.id, goalId));
    }

    const primaryKpi = planned.kpis[0];
    if (!indicatorId) {
      const [indicator] = await db
        .insert(indicators)
        .values({
          organizationId: orgId,
          clientId,
          goalId,
          perspective: planned.perspective,
          name: primaryKpi?.name ?? `KPI ${planned.perspective}`,
          direction: primaryKpi?.direction ?? "aumentar",
          unit: primaryKpi?.unit ?? "numero",
          year,
          planned: primaryKpi?.planned ?? {},
          actual: {},
        })
        .returning();
      indicatorId = indicator.id;
    } else {
      const current = existingIndicator!;
      const hasPlanned = Object.values(current.planned ?? {}).some((value) => value != null);
      const incomingPlanned = Object.values(primaryKpi?.planned ?? {}).some((value) => value != null);
      if (!hasPlanned && incomingPlanned && primaryKpi) {
        await db
          .update(indicators)
          .set({
            name: primaryKpi.name,
            direction: primaryKpi.direction,
            unit: primaryKpi.unit,
            planned: primaryKpi.planned,
            updatedAt: new Date(),
          })
          .where(eq(indicators.id, current.id));
      }
    }

    const extraKpis = planned.kpis.slice(1).filter((kpi) =>
      Object.values(kpi.planned ?? {}).some((value) => value != null),
    );
    for (const kpi of extraKpis) {
      const already = existingIndicators.some(
        (row) => row.goalId === goalId && row.name.toLowerCase() === kpi.name.toLowerCase(),
      );
      if (already) continue;
      await db.insert(indicators).values({
        organizationId: orgId,
        clientId,
        goalId,
        perspective: planned.perspective,
        name: kpi.name,
        direction: kpi.direction,
        unit: kpi.unit,
        year,
        planned: kpi.planned,
        actual: {},
      });
    }

    const hasActions =
      existingActions.some((row) => row.perspective === planned.perspective) ||
      existingActions.some((row) => row.goalId === goalId);
    if (!hasActions) {
      for (const action of planned.actions) {
        await db.insert(actionItems).values({
          organizationId: orgId,
          clientId,
          goalId,
          indicatorId,
          perspective: planned.perspective,
          title: action.title,
          how: action.how,
          ownerName: action.ownerName,
          sector: action.sector,
          status: "nao_iniciado",
        });
      }
    }
  }
}

async function planFromCockpit(orgId: string, clientId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)))
    .limit(1);
  if (!client) throw new Error("Cliente nao encontrado.");

  const diagnosticRows = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.clientId, clientId), eq(diagnostics.organizationId, orgId)))
    .orderBy(desc(diagnostics.createdAt));
  const diagnostic = pickBestDiagnostic(diagnosticRows);
  if (!diagnostic || isThinHeuristicPayload((diagnostic.payload ?? {}) as DiagnosticPayload)) {
    throw new Error("Nao ha diagnostico real para montar o BSC.");
  }

  const [insight] = await db
    .select()
    .from(marketInsights)
    .where(and(eq(marketInsights.clientId, clientId), eq(marketInsights.organizationId, orgId)))
    .orderBy(desc(marketInsights.createdAt))
    .limit(1);

  const docs = await documentContext(orgId, clientId);
  const knowledge = await retrieveKnowledge({
    orgId,
    query: `${client.name} planejamento BSC metas acoes ${client.sector ?? ""}`,
  });
  const cycle = await planOrbeCycle({
    clientName: client.name,
    sector: client.sector,
    diagnosticJson: JSON.stringify({
      payload: diagnostic.payload,
      gaps: diagnostic.gaps,
      priorities: diagnostic.priorities,
      risks: diagnostic.risks,
      openQuestions: diagnostic.openQuestions,
    }),
    marketSummary: insight?.summary,
    knowledge,
    dre: readDreBrief({
      payload: (diagnostic.payload ?? {}) as DiagnosticPayload,
      documentText: docs,
    }),
  });
  await persistCyclePlan(orgId, clientId, cycle);
}

async function proposeFromCockpit(orgId: string, clientId: string, clientName: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)))
    .limit(1);
  if (!client) return;
  const [existing] = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.clientId, clientId), eq(proposals.organizationId, orgId)))
    .limit(1);
  if (existing) return;

  const diagnosticRows = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.clientId, clientId), eq(diagnostics.organizationId, orgId)))
    .orderBy(desc(diagnostics.createdAt));
  const diagnostic = pickBestDiagnostic(diagnosticRows);
  const knowledge = await retrieveKnowledge({ orgId, query: `proposta ${clientName}` });
  await db.insert(proposals).values({
    organizationId: orgId,
    clientId,
    title: `Proposta ORBE - ${clientName}`,
    contentHtml: wrapDhDocument({
      title: `Proposta ORBE - ${clientName}`,
      clientName,
      bodyHtml: generateProposalHtml(client, diagnostic, knowledge),
    }),
    status: "rascunho",
  });
  await db
    .update(clients)
    .set({ stage: "proposta", updatedAt: new Date() })
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)));
}
