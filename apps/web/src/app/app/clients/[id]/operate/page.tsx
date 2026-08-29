import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { CRM_STAGE_LABELS, DOCUMENT_KIND_LABELS, OPERATE_STEPS, type DocumentKind } from "@orbe/shared";
import { CockpitDocumentForm } from "@/components/CockpitDocumentForm";
import { SessionCreateForm } from "@/components/SessionCreateForm";
import { Button, Card, LinkButton, PageHeader } from "@/components/ui";
import { planOperate } from "@/lib/agents/orchestrator";
import { formatDateTime } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";
import {
  actionItems,
  clientDocuments,
  clients,
  consultingSessions,
  db,
  diagnostics,
  goals,
  proposals,
} from "@/lib/db";
import { runOperateAction } from "@/app/app/operate-actions";

export default async function OperatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) notFound();

  const [sessionRows, diagnosticRows, goalRows, proposalRows, documentRows, actionRows] = await Promise.all([
    db.select().from(consultingSessions).where(and(eq(consultingSessions.clientId, id), eq(consultingSessions.organizationId, orgId))).orderBy(desc(consultingSessions.createdAt)),
    db.select().from(diagnostics).where(and(eq(diagnostics.clientId, id), eq(diagnostics.organizationId, orgId))).orderBy(desc(diagnostics.createdAt)),
    db.select().from(goals).where(and(eq(goals.clientId, id), eq(goals.organizationId, orgId))),
    db.select().from(proposals).where(and(eq(proposals.clientId, id), eq(proposals.organizationId, orgId))).orderBy(desc(proposals.createdAt)),
    db.select().from(clientDocuments).where(and(eq(clientDocuments.clientId, id), eq(clientDocuments.organizationId, orgId))).orderBy(desc(clientDocuments.createdAt)),
    db.select().from(actionItems).where(and(eq(actionItems.clientId, id), eq(actionItems.organizationId, orgId))).orderBy(desc(actionItems.createdAt)),
  ]);

  const latestSession = sessionRows[0];
  const latestDiagnostic = diagnosticRows[0];
  const plan = planOperate({
    hasReadySession: latestSession?.status === "pronto",
    hasTranscript: Boolean(latestSession?.transcriptRaw),
    hasDocument: documentRows.some((doc) => Boolean(doc.extractedText)),
    hasDiagnostic: Boolean(latestDiagnostic),
    diagnosticValidated: Boolean(latestDiagnostic?.validated),
    hasGoals: goalRows.length > 0,
    hasProposal: proposalRows.length > 0,
  });

  return (
    <>
      <PageHeader
        title={client.tradeName ?? client.name}
        description={`Operacao · ${CRM_STAGE_LABELS[client.stage]}. Grave, envie documento e avance o metodo.`}
        action={<LinkButton href={`/app/clients/${id}`}>Gestao completa</LinkButton>}
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">Proximo passo</p>
            <h2 className="mt-1 text-xl font-semibold text-[#012245]">{plan.label}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{plan.hint}</p>
          </div>
          {plan.nextAction ? (
            <form action={runOperateAction.bind(null, id)}>
              <input type="hidden" name="action" value={plan.nextAction} />
              <Button type="submit">{plan.nextLabel}</Button>
            </form>
          ) : null}
        </div>
        <ol className="mt-6 flex flex-wrap gap-2">
          {OPERATE_STEPS.map((step) => {
            const active = step === plan.current;
            return (
              <li
                key={step}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  active ? "bg-[#012245] text-white" : "bg-[#f7f4ee] text-slate-500"
                }`}
              >
                {step}
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">1. Gravar sessao</h2>
          <p className="mt-1 text-sm text-slate-500">Audio ou transcricao. Consentimento LGPD obrigatorio.</p>
          <SessionCreateForm
            clients={[{ id: client.id, name: client.name }]}
            lockedClientId={client.id}
            redirectTo={`/app/clients/${id}/operate`}
          />
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">2. Inserir documento</h2>
          <p className="mt-1 text-sm text-slate-500">
            PDF/imagem via Mistral OCR, ou texto colado. Classifica DRE, contrato, organograma.
          </p>
          <CockpitDocumentForm clientId={id} />
          <div className="mt-4 space-y-2">
            {documentRows.length === 0 ? <p className="text-sm text-slate-400">Nenhum documento ainda.</p> : null}
            {documentRows.slice(0, 5).map((doc) => (
              <div key={doc.id} className="rounded-2xl border border-slate-100 p-3 text-sm">
                <strong className="text-[#012245]">{doc.title}</strong>
                <span className="mt-1 block text-slate-500">
                  {DOCUMENT_KIND_LABELS[(doc.kind as DocumentKind) ?? "outro"] ?? doc.kind} · {doc.status} · {doc.source}
                </span>
                {doc.extractedText ? (
                  <p className="mt-2 line-clamp-3 text-slate-600">{doc.extractedText}</p>
                ) : (
                  <p className="mt-2 text-xs text-red-700">{String((doc.payload as { error?: string })?.error ?? "")}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-[#012245]">O que a IA preencheu</h2>
        <p className="mt-1 text-sm text-slate-500">Valide antes de virar plano ou proposta.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2e7271]">Sessao</p>
            {latestSession ? (
              <Link href={`/app/sessions/${latestSession.id}`} className="mt-2 block text-sm font-semibold text-[#012245] hover:underline">
                {latestSession.title}
                <span className="block font-normal text-slate-500">
                  {latestSession.status} · {formatDateTime(latestSession.createdAt)}
                </span>
              </Link>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Aguardando gravacao.</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2e7271]">Diagnostico</p>
            {latestDiagnostic ? (
              <Link href={`/app/diagnostics/${latestDiagnostic.id}`} className="mt-2 block text-sm font-semibold text-[#012245] hover:underline">
                Versao {latestDiagnostic.version} · {latestDiagnostic.validated ? "validado" : "rascunho"}
                <span className="mt-2 block font-normal text-slate-600">
                  {(latestDiagnostic.priorities ?? []).slice(0, 3).join(" · ") || "Sem prioridades ainda"}
                </span>
              </Link>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Ainda nao extraido.</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2e7271]">Plano / proposta</p>
            <p className="mt-2 text-sm text-slate-600">
              {goalRows.length} meta(s) · {actionRows.length} acao(oes) · {proposalRows.length} proposta(s)
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link href={`/app/clients/${id}/planning`} className="font-semibold text-[#2e7271]">
                Planejamento
              </Link>
              <Link href={`/app/clients/${id}/proposals`} className="font-semibold text-[#2e7271]">
                Propostas
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
