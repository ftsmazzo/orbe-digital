"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { PERSPECTIVES, type DiagnosticPayload, type Score360 } from "@orbe/shared";
import {
  actionItems,
  clientDocuments,
  clients,
  consultingSessions,
  db,
  diagnostics,
  goals,
  indicators,
  proposals,
} from "@/lib/db";
import { extractDiagnosticFromTranscript } from "@/lib/agents/extract";
import { generateProposalHtml } from "@/lib/agents/proposal";
import { wrapDhDocument } from "@/lib/brand/document";
import { classifyDocument } from "@/lib/documents/classify";
import { extractDocumentText } from "@/lib/documents/ocr";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import { getCurrentOrg } from "@/lib/org";
import { putObject } from "@/lib/storage";

const MAX_UPLOAD_BYTES = 18 * 1024 * 1024;

function operatePaths(clientId: string) {
  revalidatePath(`/app/clients/${clientId}/operate`);
  revalidatePath(`/app/clients/${clientId}`);
}

async function loadClient(clientId: string, orgId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)))
    .limit(1);
  return client;
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
  const title = hasFile ? file.name : "Anotacao colada";
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

export async function runOperateAction(clientId: string, formData: FormData) {
  const action = String(formData.get("action") ?? "");
  const { orgId, userId } = await getCurrentOrg();
  const client = await loadClient(clientId, orgId);
  if (!client) return;

  if (action === "diagnosticar") {
    await diagnoseFromCockpit(orgId, clientId, client.name);
  } else if (action === "validar") {
    const [diagnostic] = await db
      .select()
      .from(diagnostics)
      .where(and(eq(diagnostics.clientId, clientId), eq(diagnostics.organizationId, orgId)))
      .orderBy(desc(diagnostics.createdAt))
      .limit(1);
    if (diagnostic && !diagnostic.validated) {
      await db
        .update(diagnostics)
        .set({ validated: true, validatedAt: new Date(), validatedById: userId, updatedAt: new Date() })
        .where(eq(diagnostics.id, diagnostic.id));
    }
  } else if (action === "planejar") {
    await planFromCockpit(orgId, clientId);
  } else if (action === "propor") {
    await proposeFromCockpit(orgId, clientId, client.name);
  }

  operatePaths(clientId);
  revalidatePath("/app/diagnostics");
  revalidatePath(`/app/clients/${clientId}/planning`);
  revalidatePath(`/app/clients/${clientId}/proposals`);
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
  const [session] = await db
    .select()
    .from(consultingSessions)
    .where(and(eq(consultingSessions.clientId, clientId), eq(consultingSessions.organizationId, orgId)))
    .orderBy(desc(consultingSessions.createdAt))
    .limit(1);

  const docs = await documentContext(orgId, clientId);
  const transcript = [session?.transcriptRaw ?? "", docs].filter(Boolean).join("\n\n");
  if (!transcript.trim()) return;

  const knowledge = await retrieveKnowledge({ orgId, query: transcript.slice(0, 2000) });
  const extracted = await extractDiagnosticFromTranscript(transcript, clientName, knowledge);

  const [existing] = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.clientId, clientId), eq(diagnostics.organizationId, orgId)))
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
        sessionId: session?.id ?? existing.sessionId,
        version: (existing.version ?? 1) + 1,
        updatedAt: new Date(),
      })
      .where(eq(diagnostics.id, existing.id));
    return;
  }

  await db.insert(diagnostics).values({
    organizationId: orgId,
    clientId,
    sessionId: session?.id,
    payload: extracted.payload,
    maturity: extracted.maturity,
    gaps: extracted.gaps,
    priorities: extracted.priorities,
    risks: extracted.risks,
    openQuestions: extracted.openQuestions,
  });
}

async function planFromCockpit(orgId: string, clientId: string) {
  const [diagnostic] = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.clientId, clientId), eq(diagnostics.organizationId, orgId)))
    .orderBy(desc(diagnostics.createdAt))
    .limit(1);
  if (!diagnostic?.validated) return;

  const [existingGoal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.clientId, clientId), eq(goals.organizationId, orgId)))
    .limit(1);
  if (existingGoal) return;

  const year = new Date().getFullYear();
  const payload = (diagnostic.payload ?? {}) as DiagnosticPayload;
  const priorities = diagnostic.priorities?.length
    ? diagnostic.priorities
    : payload.prioridades ?? ["Estruturar controles", "Melhorar conversao", "Padronizar processos"];
  const score = payload.score360 as Score360 | undefined;
  const weakDims = score?.dimensoes
    ? Object.entries(score.dimensoes)
        .filter(([, value]) => Number(value) > 0 && Number(value) <= 2)
        .map(([key]) => key)
    : [];

  for (let i = 0; i < Math.min(4, priorities.length); i++) {
    const title = priorities[i]!;
    const perspective = PERSPECTIVES[i % PERSPECTIVES.length]!;
    const [goal] = await db
      .insert(goals)
      .values({
        organizationId: orgId,
        clientId,
        title,
        notes: weakDims.length ? `Dimensoes fracas Score360: ${weakDims.join(", ")}` : "Rascunho do cockpit",
        year,
      })
      .returning();
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

  const [diagnostic] = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.clientId, clientId), eq(diagnostics.organizationId, orgId)))
    .orderBy(desc(diagnostics.createdAt))
    .limit(1);
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
