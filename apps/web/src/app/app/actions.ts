"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ACTION_STATUSES, CRM_STAGES, PERSPECTIVES, computeScore360Total, type ActionStatus, type CrmStage, type Perspective, type SalesQualification, type Score360 } from "@orbe/shared";
import {
  actionItems,
  clientArtifacts,
  clientPeople,
  clientContracts,
  clientFinancials,
  clients,
  consultingSessions,
  db,
  diagnostics,
  goals,
  indicators,
  knowledgeChunks,
  knowledgeSources,
  marketInsights,
  organizations,
  proposals,
  reports,
  salesScoreEvents,
} from "@/lib/db";
import { extractDiagnosticFromTranscript, mockTranscript } from "@/lib/agents/extract";
import { researchMarketEnriched, type MarketScope } from "@/lib/agents/market-research-apify";
import { generateProposalHtml } from "@/lib/agents/proposal";
import { generateReportHtml } from "@/lib/agents/report";
import { dueDateFromBusinessDays } from "@/lib/finance/business-days";
import { computePayrollCost } from "@/lib/finance/payroll-cost";
import { computeValuation, type ValuationInput } from "@/lib/finance/valuation";
import { computeWorkingCapital, type WorkingCapitalInput } from "@/lib/finance/working-capital";
import { mergeOrgSettings } from "@/lib/sales/playbook";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import { generateContractHtml } from "@/lib/sales/contract";
import { scoreClient } from "@/lib/sales/score-client";
import { computeEbitda } from "@/lib/finance/ebitda";
import { wrapDhDocument } from "@/lib/brand/document";
import { getCurrentOrg } from "@/lib/org";
import { putObject } from "@/lib/storage";
import type { DiagnosticPayload } from "@orbe/shared";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? Number(value) : undefined;
}

function lines(value?: string) {
  return value?.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) ?? [];
}

function monthlyJson(formData: FormData, prefix: string) {
  return Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, "0");
      const value = numberValue(formData, `${prefix}_${month}`);
      return [month, Number.isFinite(value) ? value ?? null : null];
    }),
  );
}

function parseDate(value?: string) {
  return value ? new Date(`${value}T12:00:00`) : undefined;
}

export async function createClient(formData: FormData) {
  const { orgId } = await getCurrentOrg();
  const [client] = await db
    .insert(clients)
    .values({
      organizationId: orgId,
      name: text(formData, "name") ?? "Novo cliente",
      tradeName: text(formData, "tradeName"),
      cnpj: text(formData, "cnpj"),
      sector: text(formData, "sector"),
      email: text(formData, "email"),
      phone: text(formData, "phone"),
      city: text(formData, "city"),
      notes: text(formData, "notes"),
      stage: (text(formData, "stage") as CrmStage) ?? "lead",
    })
    .returning();

  revalidatePath("/app/clients");
  redirect(`/app/clients/${client.id}/operate`);
}

export async function updateClient(clientId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  await db
    .update(clients)
    .set({
      name: text(formData, "name") ?? "Cliente",
      tradeName: text(formData, "tradeName"),
      cnpj: text(formData, "cnpj"),
      sector: text(formData, "sector"),
      email: text(formData, "email"),
      phone: text(formData, "phone"),
      city: text(formData, "city"),
      notes: text(formData, "notes"),
      stage: (text(formData, "stage") as CrmStage) ?? "lead",
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)));

  revalidatePath(`/app/clients/${clientId}`);
  revalidatePath("/app/clients");
}

export async function updateClientStage(clientId: string, formData: FormData) {
  const stage = text(formData, "stage") as CrmStage;
  if (!CRM_STAGES.includes(stage)) return;

  const { orgId } = await getCurrentOrg();
  await db
    .update(clients)
    .set({ stage, updatedAt: new Date() })
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)));

  revalidatePath("/app/clients");
}

async function persistTranscriptAndDiagnostic(opts: {
  orgId: string;
  clientId: string;
  sessionId: string;
  clientName: string;
  transcript: string;
}) {
  const knowledge = await retrieveKnowledge({
    orgId: opts.orgId,
    query: opts.transcript.slice(0, 2000),
  });
  const extracted = await extractDiagnosticFromTranscript(opts.transcript, opts.clientName, knowledge);
  await db
    .update(consultingSessions)
    .set({
      transcriptRaw: opts.transcript,
      transcriptSegments: [{ speaker: "ORBE", text: opts.transcript }],
      status: "pronto",
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(consultingSessions.id, opts.sessionId));

  await db.insert(diagnostics).values({
    organizationId: opts.orgId,
    clientId: opts.clientId,
    sessionId: opts.sessionId,
    payload: extracted.payload,
    maturity: extracted.maturity,
    gaps: extracted.gaps,
    priorities: extracted.priorities,
    risks: extracted.risks,
    openQuestions: extracted.openQuestions,
  });
}

export async function createSession(formData: FormData) {
  const { orgId, userId } = await getCurrentOrg();
  const clientId = text(formData, "clientId");
  if (!clientId) return;

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)))
    .limit(1);
  if (!client) return;

  const audio = formData.get("audio");
  const hasAudio = audio instanceof File && audio.size > 0;
  const pastedTranscript = text(formData, "transcript");
  const [session] = await db
    .insert(consultingSessions)
    .values({
      organizationId: orgId,
      clientId,
      title: text(formData, "title") ?? `Sessao ORBE - ${client.name}`,
      kind: text(formData, "kind") ?? "ciclo",
      consentGiven: formData.get("consentGiven") === "on",
      consentAt: formData.get("consentGiven") === "on" ? new Date() : undefined,
      status: hasAudio || pastedTranscript ? "processando" : "gravando",
      createdById: userId,
    })
    .returning();

  if (pastedTranscript) {
    await persistTranscriptAndDiagnostic({
      orgId,
      clientId,
      sessionId: session.id,
      clientName: client.name,
      transcript: pastedTranscript,
    });
  } else if (hasAudio) {
    const stored = await putObject(audio, `sessions/${session.id}`);
    await db
      .update(consultingSessions)
      .set({
        audioKey: stored.key,
        audioUrl: stored.url,
        mimeType: audio.type,
        status: "processando",
        updatedAt: new Date(),
      })
      .where(eq(consultingSessions.id, session.id));

    if (process.env.N8N_WEBHOOK_STT) {
      const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "";
      const callbackSecret = process.env.N8N_CALLBACK_SECRET ?? "dev-callback";
      await fetch(process.env.N8N_WEBHOOK_STT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          clientId,
          clientName: client.name,
          audioKey: stored.key,
          mimeType: audio.type || "audio/webm",
          callbackSecret,
          audioDownloadUrl: `${baseUrl}/api/internal/sessions/${session.id}/audio`,
          callbackUrl: `${baseUrl}/api/webhooks/n8n/session`,
        }),
      });
    } else {
      await persistTranscriptAndDiagnostic({
        orgId,
        clientId,
        sessionId: session.id,
        clientName: client.name,
        transcript: mockTranscript(client.name),
      });
    }
  }

  await db
    .update(clients)
    .set({ stage: "sessao", updatedAt: new Date() })
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)));

  revalidatePath("/app/sessions");
  revalidatePath(`/app/clients/${clientId}`);
  redirect(`/app/sessions/${session.id}`);
}

export async function applySessionTranscript(sessionId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  const transcript = text(formData, "transcript");
  if (!transcript) return;

  const [session] = await db
    .select()
    .from(consultingSessions)
    .where(and(eq(consultingSessions.id, sessionId), eq(consultingSessions.organizationId, orgId)))
    .limit(1);
  if (!session) return;

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, session.clientId), eq(clients.organizationId, orgId)))
    .limit(1);
  if (!client) return;

  await persistTranscriptAndDiagnostic({
    orgId,
    clientId: session.clientId,
    sessionId,
    clientName: client.name,
    transcript,
  });

  revalidatePath(`/app/sessions/${sessionId}`);
  revalidatePath("/app/diagnostics");
  revalidatePath(`/app/clients/${session.clientId}`);
}

export async function reextractSessionDiagnostic(sessionId: string) {
  const { orgId } = await getCurrentOrg();
  const [session] = await db
    .select()
    .from(consultingSessions)
    .where(and(eq(consultingSessions.id, sessionId), eq(consultingSessions.organizationId, orgId)))
    .limit(1);
  if (!session?.transcriptRaw) return;

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, session.clientId), eq(clients.organizationId, orgId)))
    .limit(1);
  if (!client) return;

  const knowledge = await retrieveKnowledge({
    orgId,
    query: session.transcriptRaw.slice(0, 2000),
  });
  const extracted = await extractDiagnosticFromTranscript(session.transcriptRaw, client.name, knowledge);

  const [existing] = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.sessionId, sessionId), eq(diagnostics.organizationId, orgId)))
    .orderBy(desc(diagnostics.createdAt))
    .limit(1);

  if (existing && !existing.validated) {
    await db
      .update(diagnostics)
      .set({
        payload: extracted.payload,
        maturity: extracted.maturity,
        gaps: extracted.gaps,
        priorities: extracted.priorities,
        risks: extracted.risks,
        openQuestions: extracted.openQuestions,
        version: (existing.version ?? 1) + 1,
        updatedAt: new Date(),
      })
      .where(eq(diagnostics.id, existing.id));
    revalidatePath(`/app/diagnostics/${existing.id}`);
  } else {
    const [created] = await db
      .insert(diagnostics)
      .values({
        organizationId: orgId,
        clientId: session.clientId,
        sessionId,
        payload: extracted.payload,
        maturity: extracted.maturity,
        gaps: extracted.gaps,
        priorities: extracted.priorities,
        risks: extracted.risks,
        openQuestions: extracted.openQuestions,
      })
      .returning();
    if (created) revalidatePath(`/app/diagnostics/${created.id}`);
  }

  revalidatePath(`/app/sessions/${sessionId}`);
  revalidatePath("/app/diagnostics");
  revalidatePath(`/app/clients/${session.clientId}`);
}

export async function saveDiagnostic(diagnosticId: string, formData: FormData) {
  const { orgId, userId } = await getCurrentOrg();

  let payload: DiagnosticPayload = {};
  const structured = text(formData, "payloadStructured");
  if (structured) {
    try {
      payload = JSON.parse(structured) as DiagnosticPayload;
    } catch {
      payload = {};
    }
  } else {
    try {
      payload = JSON.parse(text(formData, "payload") ?? "{}") as DiagnosticPayload;
    } catch {
      payload = {};
    }
  }

  if (payload.score360?.perfil && payload.score360.dimensoes) {
    const total = computeScore360Total(payload.score360.perfil, payload.score360.dimensoes);
    payload = { ...payload, score360: { ...payload.score360, total } };
  }

  const maturityFromScore =
    payload.score360?.total != null
      ? Math.max(1, Math.min(5, Math.round((payload.score360.total / 100) * 5)))
      : undefined;

  await db
    .update(diagnostics)
    .set({
      payload,
      maturity: numberValue(formData, "maturity") ?? maturityFromScore,
      gaps: lines(text(formData, "gaps")),
      priorities: lines(text(formData, "priorities")),
      risks: lines(text(formData, "risks")),
      openQuestions: lines(text(formData, "openQuestions")),
      version: Number(formData.get("version") ?? 1),
      validated: false,
      validatedAt: null,
      validatedById: null,
      updatedAt: new Date(),
    })
    .where(and(eq(diagnostics.id, diagnosticId), eq(diagnostics.organizationId, orgId)));

  void userId;
  revalidatePath(`/app/diagnostics/${diagnosticId}`);
}

export async function validateDiagnostic(diagnosticId: string) {
  const { orgId, userId } = await getCurrentOrg();
  await db
    .update(diagnostics)
    .set({ validated: true, validatedAt: new Date(), validatedById: userId, updatedAt: new Date() })
    .where(and(eq(diagnostics.id, diagnosticId), eq(diagnostics.organizationId, orgId)));

  revalidatePath(`/app/diagnostics/${diagnosticId}`);
}

export async function createGoal(clientId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  await db.insert(goals).values({
    organizationId: orgId,
    clientId,
    title: text(formData, "title") ?? "Meta ORBE",
    notes: text(formData, "notes"),
    year: numberValue(formData, "year") ?? new Date().getFullYear(),
  });
  revalidatePath(`/app/clients/${clientId}/planning`);
}

export async function createIndicator(clientId: string, formData: FormData) {
  const perspective = text(formData, "perspective") as Perspective;
  if (!PERSPECTIVES.includes(perspective)) return;

  const { orgId } = await getCurrentOrg();
  await db.insert(indicators).values({
    organizationId: orgId,
    clientId,
    goalId: text(formData, "goalId"),
    perspective,
    name: text(formData, "name") ?? "Indicador",
    direction: text(formData, "direction") ?? "aumentar",
    unit: text(formData, "unit") ?? "numero",
    year: numberValue(formData, "year") ?? new Date().getFullYear(),
    planned: monthlyJson(formData, "planned"),
    actual: monthlyJson(formData, "actual"),
  });
  revalidatePath(`/app/clients/${clientId}/planning`);
  revalidatePath(`/app/clients/${clientId}/dashboard`);
}

export async function runMarketResearch(clientId: string, formData: FormData) {
  const scope = (text(formData, "scope") as MarketScope) ?? "regional";
  if (scope !== "regional" && scope !== "global") return;

  const { orgId } = await getCurrentOrg();
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)))
    .limit(1);
  if (!client) return;

  const knowledge = await retrieveKnowledge({
    orgId,
    query: `${client.name} ${client.sector ?? ""} mercado ${scope}`,
  });
  const research = await researchMarketEnriched({
    clientName: client.name,
    sector: text(formData, "sector") ?? client.sector,
    city: client.city,
    scope,
    region: text(formData, "region") ?? client.city,
    website: text(formData, "website"),
    knowledge,
  });
  await db.insert(marketInsights).values({
    organizationId: orgId,
    clientId,
    scope: research.scope,
    region: research.region,
    sector: research.sector,
    summary:
      research.source === "tavily+llm" ? `[Tavily+LLM] ${research.summary}` : `[Sonar+LLM] ${research.summary}`,
    payload: research.payload,
  });

  const applyIndicators = formData.get("applyIndicators") === "on";
  if (applyIndicators) {
    const year = new Date().getFullYear();
    for (const item of research.payload.indicadores_sugeridos) {
      const perspective = item.perspectiva as Perspective;
      if (!PERSPECTIVES.includes(perspective)) continue;
      await db.insert(indicators).values({
        organizationId: orgId,
        clientId,
        perspective,
        name: item.nome,
        direction: "aumentar",
        unit: item.unidade,
        year,
        planned: {},
        actual: {},
      });
    }
  }

  revalidatePath(`/app/clients/${clientId}/planning`);
  revalidatePath(`/app/clients/${clientId}/dashboard`);
}

export async function createActionItem(clientId: string, formData: FormData) {
  const perspective = text(formData, "perspective") as Perspective | undefined;
  const status = (text(formData, "status") as ActionStatus) ?? "nao_iniciado";
  if (perspective && !PERSPECTIVES.includes(perspective)) return;
  if (!ACTION_STATUSES.includes(status)) return;

  const { orgId } = await getCurrentOrg();
  const startDate = parseDate(text(formData, "startDate"));
  let dueDate = parseDate(text(formData, "dueDate"));
  const businessDays = numberValue(formData, "businessDays");

  if (startDate && businessDays && !dueDate) {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    const settings = mergeOrgSettings(org?.settings);
    const dueIso = dueDateFromBusinessDays(
      startDate.toISOString().slice(0, 10),
      businessDays,
      startDate.getFullYear(),
      settings.localHolidays,
    );
    dueDate = parseDate(dueIso);
  }

  await db.insert(actionItems).values({
    organizationId: orgId,
    clientId,
    goalId: text(formData, "goalId"),
    indicatorId: text(formData, "indicatorId"),
    perspective,
    title: text(formData, "title") ?? "Acao ORBE",
    how: text(formData, "how"),
    sector: text(formData, "sector"),
    ownerName: text(formData, "ownerName"),
    startDate,
    dueDate,
    businessDays,
    status,
  });
  revalidatePath(`/app/clients/${clientId}/actions`);
  revalidatePath(`/app/clients/${clientId}/dashboard`);
}

export async function updateActionStatus(actionId: string, clientId: string, formData: FormData) {
  const status = text(formData, "status") as ActionStatus;
  if (!ACTION_STATUSES.includes(status)) return;
  const { orgId } = await getCurrentOrg();
  await db
    .update(actionItems)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(actionItems.id, actionId), eq(actionItems.organizationId, orgId)));
  revalidatePath(`/app/clients/${clientId}/actions`);
}

export async function generateReport(clientId: string) {
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId))).limit(1);
  if (!client) return;
  const indicatorRows = await db.select().from(indicators).where(and(eq(indicators.clientId, clientId), eq(indicators.organizationId, orgId)));
  const actionRows = await db.select().from(actionItems).where(and(eq(actionItems.clientId, clientId), eq(actionItems.organizationId, orgId)));
  const knowledge = await retrieveKnowledge({ orgId, query: `relatorio ${client.name}` });
  const [report] = await db
    .insert(reports)
    .values({
      organizationId: orgId,
      clientId,
      type: "mensal",
      title: `Relatorio ORBE - ${client.name}`,
      contentHtml: wrapDhDocument({
        title: `Relatorio ORBE - ${client.name}`,
        clientName: client.name,
        bodyHtml: generateReportHtml(client, indicatorRows, actionRows, knowledge),
      }),
    })
    .returning();
  revalidatePath(`/app/clients/${clientId}/reports`);
  redirect(`/app/clients/${clientId}/reports#${report.id}`);
}

export async function updateReport(reportId: string, clientId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  await db
    .update(reports)
    .set({ title: text(formData, "title") ?? "Relatorio ORBE", contentHtml: text(formData, "contentHtml") ?? "" })
    .where(and(eq(reports.id, reportId), eq(reports.organizationId, orgId)));
  revalidatePath(`/app/clients/${clientId}/reports`);
}

export async function approveReport(reportId: string, clientId: string) {
  const { orgId } = await getCurrentOrg();
  await db
    .update(reports)
    .set({ approved: true, approvedAt: new Date() })
    .where(and(eq(reports.id, reportId), eq(reports.organizationId, orgId)));
  revalidatePath(`/app/clients/${clientId}/reports`);
}

export async function generateProposal(clientId: string) {
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId))).limit(1);
  if (!client) return;
  const [diagnostic] = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.clientId, clientId), eq(diagnostics.organizationId, orgId)))
    .orderBy(desc(diagnostics.createdAt))
    .limit(1);
  const knowledge = await retrieveKnowledge({ orgId, query: `proposta ${client.name}` });
  const [proposal] = await db
    .insert(proposals)
    .values({
      organizationId: orgId,
      clientId,
      title: `Proposta ORBE - ${client.name}`,
      contentHtml: wrapDhDocument({
        title: `Proposta ORBE - ${client.name}`,
        clientName: client.name,
        bodyHtml: generateProposalHtml(client, diagnostic, knowledge),
      }),
      status: "rascunho",
    })
    .returning();
  await db.update(clients).set({ stage: "proposta", updatedAt: new Date() }).where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)));
  revalidatePath(`/app/clients/${clientId}/proposals`);
  redirect(`/app/clients/${clientId}/proposals#${proposal.id}`);
}

export async function updateProposal(proposalId: string, clientId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  await db
    .update(proposals)
    .set({
      title: text(formData, "title") ?? "Proposta ORBE",
      contentHtml: text(formData, "contentHtml") ?? "",
      investment: text(formData, "investment"),
      status: text(formData, "status") ?? "rascunho",
      updatedAt: new Date(),
    })
    .where(and(eq(proposals.id, proposalId), eq(proposals.organizationId, orgId)));
  revalidatePath(`/app/clients/${clientId}/proposals`);
}

export async function saveSalesQualification(clientId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  let qualification: SalesQualification = {};
  try {
    qualification = JSON.parse(text(formData, "salesQualification") ?? "{}") as SalesQualification;
  } catch {
    qualification = {};
  }
  const events = await db
    .select()
    .from(salesScoreEvents)
    .where(eq(salesScoreEvents.organizationId, orgId));
  const scored = scoreClient(qualification, events.map((e) => ({ verdict: e.verdict, payload: e.payload })));
  qualification.score = scored.score;
  qualification.scoreLabel = scored.label;
  await db
    .update(clients)
    .set({ salesQualification: qualification, updatedAt: new Date() })
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)));
  if (qualification.decision === "admitir" || qualification.decision === "nao_admitir") {
    const [last] = await db
      .select()
      .from(salesScoreEvents)
      .where(and(eq(salesScoreEvents.organizationId, orgId), eq(salesScoreEvents.clientId, clientId)))
      .orderBy(desc(salesScoreEvents.createdAt))
      .limit(1);
    if (!last || last.verdict !== qualification.decision) {
      await db.insert(salesScoreEvents).values({
        organizationId: orgId,
        clientId,
        verdict: qualification.decision,
        payload: qualification as Record<string, unknown>,
      });
    }
  }
  revalidatePath(`/app/clients/${clientId}`);
}

export async function saveClientTeams(clientId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  const teams = lines(text(formData, "teams"));
  await db
    .update(clients)
    .set({ teams, updatedAt: new Date() })
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)));
  revalidatePath(`/app/clients/${clientId}`);
  revalidatePath(`/app/clients/${clientId}/team`);
}

export async function saveOrgSettings(formData: FormData) {
  const { orgId } = await getCurrentOrg();
  let priceBook = mergeOrgSettings().priceBook;
  try {
    priceBook = JSON.parse(text(formData, "priceBook") ?? "[]");
  } catch {
    /* keep default */
  }
  const settings = {
    playbookVersion: numberValue(formData, "playbookVersion") ?? 1,
    monthlyRevenueGoal: numberValue(formData, "monthlyRevenueGoal") ?? 50000,
    localHolidays: lines(text(formData, "localHolidays")),
    priceBook,
  };
  await db.update(organizations).set({ settings }).where(eq(organizations.id, orgId));
  revalidatePath("/app/settings");
}

export async function draftPlanFromDiagnostic(diagnosticId: string) {
  const { orgId } = await getCurrentOrg();
  const [diagnostic] = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.id, diagnosticId), eq(diagnostics.organizationId, orgId)))
    .limit(1);
  if (!diagnostic) return;

  const clientId = diagnostic.clientId;
  const year = new Date().getFullYear();
  const payload = (diagnostic.payload ?? {}) as DiagnosticPayload;
  const priorities = diagnostic.priorities?.length
    ? diagnostic.priorities
    : payload.prioridades ?? ["Estruturar controles", "Melhorar conversao", "Padronizar processos"];
  const score = payload.score360 as Score360 | undefined;
  const weakDims =
    score?.dimensoes
      ? Object.entries(score.dimensoes)
          .filter(([, v]) => Number(v) > 0 && Number(v) <= 2)
          .map(([k]) => k)
      : [];

  const perspectiveCycle = [...PERSPECTIVES];
  for (let i = 0; i < Math.min(4, priorities.length); i++) {
    const title = priorities[i]!;
    const [goal] = await db
      .insert(goals)
      .values({
        organizationId: orgId,
        clientId,
        title,
        notes: weakDims.length ? `Dimensoes fracas Score360: ${weakDims.join(", ")}` : "Rascunho a partir do diagnostico",
        year,
      })
      .returning();

    const perspective = perspectiveCycle[i % perspectiveCycle.length]!;
    const [indicator] = await db
      .insert(indicators)
      .values({
        organizationId: orgId,
        clientId,
        goalId: goal.id,
        perspective,
        name: `KPI — ${title.slice(0, 60)}`,
        direction: "aumentar",
        unit: "numero",
        year,
        planned: {},
        actual: {},
      })
      .returning();

    await db.insert(actionItems).values({
      organizationId: orgId,
      clientId,
      goalId: goal.id,
      indicatorId: indicator.id,
      perspective,
      title: `PA: ${title.slice(0, 80)}`,
      how: "Detalhar com o cliente na reuniao de planejamento (R).",
      status: "nao_iniciado",
    });
  }

  revalidatePath(`/app/clients/${clientId}/planning`);
  revalidatePath(`/app/clients/${clientId}/actions`);
  revalidatePath(`/app/diagnostics/${diagnosticId}`);
  redirect(`/app/clients/${clientId}/planning`);
}

export async function saveWorkingCapital(clientId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  let input: WorkingCapitalInput;
  try {
    input = JSON.parse(text(formData, "payload") ?? "{}") as WorkingCapitalInput;
  } catch {
    return;
  }
  const result = computeWorkingCapital(input);
  const existing = await db
    .select()
    .from(clientArtifacts)
    .where(
      and(
        eq(clientArtifacts.clientId, clientId),
        eq(clientArtifacts.organizationId, orgId),
        eq(clientArtifacts.kind, "working_capital"),
      ),
    )
    .orderBy(desc(clientArtifacts.createdAt))
    .limit(1);

  const payload = { input, result };
  if (existing[0]) {
    await db
      .update(clientArtifacts)
      .set({
        payload,
        title: `Capital de giro — ${input.companyName ?? "cliente"}`,
        version: existing[0].version + 1,
        status: "rascunho",
        updatedAt: new Date(),
      })
      .where(eq(clientArtifacts.id, existing[0].id));
  } else {
    await db.insert(clientArtifacts).values({
      organizationId: orgId,
      clientId,
      kind: "working_capital",
      title: `Capital de giro — ${input.companyName ?? "cliente"}`,
      payload,
    });
  }
  revalidatePath(`/app/clients/${clientId}/finance/working-capital`);
}

export async function saveValuation(clientId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  let input: ValuationInput;
  try {
    input = JSON.parse(text(formData, "payload") ?? "{}") as ValuationInput;
  } catch {
    return;
  }
  const result = computeValuation(input);
  const existing = await db
    .select()
    .from(clientArtifacts)
    .where(
      and(
        eq(clientArtifacts.clientId, clientId),
        eq(clientArtifacts.organizationId, orgId),
        eq(clientArtifacts.kind, "valuation"),
      ),
    )
    .orderBy(desc(clientArtifacts.createdAt))
    .limit(1);

  const payload = { input, result };
  if (existing[0]) {
    await db
      .update(clientArtifacts)
      .set({
        payload,
        title: input.title || "Valuation",
        version: existing[0].version + 1,
        updatedAt: new Date(),
      })
      .where(eq(clientArtifacts.id, existing[0].id));
  } else {
    await db.insert(clientArtifacts).values({
      organizationId: orgId,
      clientId,
      kind: "valuation",
      title: input.title || "Valuation",
      payload,
    });
  }
  revalidatePath(`/app/clients/${clientId}/finance/valuation`);
}

export async function addClientPerson(clientId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  await db.insert(clientPeople).values({
    organizationId: orgId,
    clientId,
    name: text(formData, "name") ?? "Colaborador",
    role: text(formData, "role"),
    team: text(formData, "team"),
    salaryBase: text(formData, "salaryBase") ?? "0",
    employerCostFactor: text(formData, "employerCostFactor") ?? "1.7",
  });
  await refreshPayrollArtifact(clientId, orgId);
  revalidatePath(`/app/clients/${clientId}/finance/payroll`);
  revalidatePath(`/app/clients/${clientId}/team`);
}

export async function removeClientPerson(personId: string, clientId: string) {
  const { orgId } = await getCurrentOrg();
  await db
    .delete(clientPeople)
    .where(and(eq(clientPeople.id, personId), eq(clientPeople.organizationId, orgId)));
  await refreshPayrollArtifact(clientId, orgId);
  revalidatePath(`/app/clients/${clientId}/finance/payroll`);
  revalidatePath(`/app/clients/${clientId}/team`);
}

async function refreshPayrollArtifact(clientId: string, orgId: string) {
  const people = await db
    .select()
    .from(clientPeople)
    .where(and(eq(clientPeople.clientId, clientId), eq(clientPeople.organizationId, orgId)));
  const result = computePayrollCost(
    people.map((p) => ({
      name: p.name,
      role: p.role ?? undefined,
      team: p.team ?? undefined,
      salaryBase: Number(p.salaryBase ?? 0),
      employerCostFactor: Number(p.employerCostFactor ?? 1.7),
      active: p.active,
    })),
  );
  const existing = await db
    .select()
    .from(clientArtifacts)
    .where(
      and(
        eq(clientArtifacts.clientId, clientId),
        eq(clientArtifacts.organizationId, orgId),
        eq(clientArtifacts.kind, "payroll_cost"),
      ),
    )
    .limit(1);
  const payload = { people: people.map((p) => p.id), result };
  if (existing[0]) {
    await db
      .update(clientArtifacts)
      .set({ payload, title: "Custo de pessoal", version: existing[0].version + 1, updatedAt: new Date() })
      .where(eq(clientArtifacts.id, existing[0].id));
  } else {
    await db.insert(clientArtifacts).values({
      organizationId: orgId,
      clientId,
      kind: "payroll_cost",
      title: "Custo de pessoal",
      payload,
    });
  }
}

export async function saveMonthlyEbitda(clientId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  const row = {
    revenueNet: Number(text(formData, "revenueNet") ?? 0),
    cpv: Number(text(formData, "cpv") ?? 0),
    opex: Number(text(formData, "opex") ?? 0),
    depreciation: Number(text(formData, "depreciation") ?? 0),
    amortization: Number(text(formData, "amortization") ?? 0),
  };
  await db.insert(clientFinancials).values({
    organizationId: orgId,
    clientId,
    year: numberValue(formData, "year") ?? new Date().getFullYear(),
    month: numberValue(formData, "month") ?? new Date().getMonth() + 1,
    revenueNet: String(row.revenueNet),
    cpv: String(row.cpv),
    opex: String(row.opex),
    depreciation: String(row.depreciation),
    amortization: String(row.amortization),
    ebitda: String(computeEbitda(row)),
    notes: text(formData, "notes"),
  });
  revalidatePath(`/app/clients/${clientId}/finance/ebitda`);
}

export async function generateClientContract(clientId: string, formData: FormData) {
  const { orgId } = await getCurrentOrg();
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)))
    .limit(1);
  if (!client) return;
  const billingStart = (text(formData, "billingStart") as "m1" | "m6") ?? "m6";
  const html = generateContractHtml({
    clientName: client.name,
    clientCnpj: client.cnpj ?? undefined,
    billingStart,
  });
  const [row] = await db
    .insert(clientContracts)
    .values({
      organizationId: orgId,
      clientId,
      title: `Contrato success-fee 15% EBITDA (${billingStart}) — ${client.name}`,
      billingStart,
      contentHtml: html,
      startDate: parseDate(text(formData, "startDate")),
    })
    .returning();
  await db.update(clients).set({ stage: "contrato", updatedAt: new Date() }).where(eq(clients.id, clientId));
  revalidatePath(`/app/clients/${clientId}/contracts`);
  redirect(`/print/contract/${row.id}`);
}

export async function addKnowledgeNote(formData: FormData) {
  const { orgId } = await getCurrentOrg();
  const title = text(formData, "title") ?? "Nota de acervo";
  const [source] = await db
    .insert(knowledgeSources)
    .values({
      organizationId: orgId,
      title,
      author: text(formData, "author"),
      area: text(formData, "area") ?? "principios",
      weight: numberValue(formData, "weight") ?? 1,
      kind: "note",
    })
    .returning();
  await db.insert(knowledgeChunks).values({
    organizationId: orgId,
    sourceId: source.id,
    heading: title,
    content: text(formData, "content") ?? "",
  });
  revalidatePath("/app/settings/knowledge");
}
