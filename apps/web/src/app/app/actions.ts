"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ACTION_STATUSES, CRM_STAGES, PERSPECTIVES, type ActionStatus, type CrmStage, type Perspective } from "@orbe/shared";
import {
  actionItems,
  clients,
  consultingSessions,
  db,
  diagnostics,
  goals,
  indicators,
  proposals,
  reports,
} from "@/lib/db";
import { extractDiagnosticFromTranscript, mockTranscript } from "@/lib/agents/extract";
import { generateProposalHtml } from "@/lib/agents/proposal";
import { generateReportHtml } from "@/lib/agents/report";
import { getCurrentOrg } from "@/lib/org";
import { putObject } from "@/lib/storage";

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
  redirect(`/app/clients/${client.id}`);
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
  const extracted = extractDiagnosticFromTranscript(opts.transcript, opts.clientName);
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

export async function saveDiagnostic(diagnosticId: string, formData: FormData) {
  const { orgId, userId } = await getCurrentOrg();
  let payload = {};
  try {
    payload = JSON.parse(text(formData, "payload") ?? "{}");
  } catch {
    payload = {};
  }

  await db
    .update(diagnostics)
    .set({
      payload,
      maturity: numberValue(formData, "maturity"),
      gaps: lines(text(formData, "gaps")),
      priorities: lines(text(formData, "priorities")),
      risks: lines(text(formData, "risks")),
      openQuestions: lines(text(formData, "openQuestions")),
      version: Number(formData.get("version") ?? 1),
      validatedById: undefined,
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

export async function createActionItem(clientId: string, formData: FormData) {
  const perspective = text(formData, "perspective") as Perspective | undefined;
  const status = (text(formData, "status") as ActionStatus) ?? "nao_iniciado";
  if (perspective && !PERSPECTIVES.includes(perspective)) return;
  if (!ACTION_STATUSES.includes(status)) return;

  const { orgId } = await getCurrentOrg();
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
    startDate: parseDate(text(formData, "startDate")),
    dueDate: parseDate(text(formData, "dueDate")),
    businessDays: numberValue(formData, "businessDays"),
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
  const [report] = await db
    .insert(reports)
    .values({
      organizationId: orgId,
      clientId,
      type: "mensal",
      title: `Relatorio ORBE - ${client.name}`,
      contentHtml: generateReportHtml(client, indicatorRows, actionRows),
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
  const [proposal] = await db
    .insert(proposals)
    .values({
      organizationId: orgId,
      clientId,
      title: `Proposta ORBE - ${client.name}`,
      contentHtml: generateProposalHtml(client, diagnostic),
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
