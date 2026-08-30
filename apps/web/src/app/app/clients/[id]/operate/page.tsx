import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import {
  DOCUMENT_KIND_LABELS,
  PERSPECTIVE_LABELS_DANIEL,
  type DiagnosticPayload,
  type DocumentKind,
  type Perspective,
  type SalesQualification,
} from "@orbe/shared";
import { CockpitDocumentForm, ConsultantDirectionForm } from "@/components/CockpitDocumentForm";
import { ClientFitBanner } from "@/components/ClientFitBanner";
import { CycleRunBanner } from "@/components/CycleRunBanner";
import { OperateActionButton } from "@/components/OperateActionButton";
import { SessionCreateForm } from "@/components/SessionCreateForm";
import { ClientWorkspaceNav } from "@/components/ClientWorkspaceNav";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import {
  buildProcessBrief,
  isThinHeuristicPayload,
  missingFichaFields,
  pickBestDiagnostic,
} from "@/lib/agents/process-status";
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
  indicators,
  marketInsights,
  proposals,
} from "@/lib/db";

export const maxDuration = 180;

const PHASE_TONE = {
  ok: "border-[#2e7271]/30 bg-[#2e7271]/5 text-[#012245]",
  parcial: "border-[#c8a04c]/40 bg-[#c8a04c]/10 text-[#012245]",
  falta: "border-[#c0392b]/25 bg-[#c0392b]/5 text-[#012245]",
} as const;

export default async function OperatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) notFound();

  const [sessionRows, diagnosticRows, goalRows, indicatorRows, proposalRows, documentRows, actionRows, marketRows] =
    await Promise.all([
      db
        .select()
        .from(consultingSessions)
        .where(and(eq(consultingSessions.clientId, id), eq(consultingSessions.organizationId, orgId)))
        .orderBy(desc(consultingSessions.createdAt)),
      db
        .select()
        .from(diagnostics)
        .where(and(eq(diagnostics.clientId, id), eq(diagnostics.organizationId, orgId)))
        .orderBy(desc(diagnostics.createdAt)),
      db.select().from(goals).where(and(eq(goals.clientId, id), eq(goals.organizationId, orgId))),
      db.select().from(indicators).where(and(eq(indicators.clientId, id), eq(indicators.organizationId, orgId))),
      db
        .select()
        .from(proposals)
        .where(and(eq(proposals.clientId, id), eq(proposals.organizationId, orgId)))
        .orderBy(desc(proposals.createdAt)),
      db
        .select()
        .from(clientDocuments)
        .where(and(eq(clientDocuments.clientId, id), eq(clientDocuments.organizationId, orgId)))
        .orderBy(desc(clientDocuments.createdAt)),
      db
        .select()
        .from(actionItems)
        .where(and(eq(actionItems.clientId, id), eq(actionItems.organizationId, orgId)))
        .orderBy(desc(actionItems.createdAt)),
      db
        .select()
        .from(marketInsights)
        .where(and(eq(marketInsights.clientId, id), eq(marketInsights.organizationId, orgId)))
        .orderBy(desc(marketInsights.createdAt)),
    ]);

  const bestDiagnostic = pickBestDiagnostic(diagnosticRows);
  const payload = (bestDiagnostic?.payload ?? {}) as DiagnosticPayload;
  const thin = isThinHeuristicPayload(payload);
  const missingFields = missingFichaFields(payload);
  const globalGoals = goalRows.filter((goal) => goal.notes?.startsWith("[global]"));
  const perspectiveGoals = goalRows.filter((goal) => !goal.notes?.startsWith("[global]"));
  const brief = buildProcessBrief({
    sessionsReady: sessionRows.filter((row) => row.status === "pronto").length,
    sessionsProcessing: sessionRows.filter((row) => row.status === "processando").length,
    sessionsWithTranscript: sessionRows.filter((row) => Boolean(row.transcriptRaw?.trim())).length,
    documents: documentRows.length,
    hasDiagnostic: Boolean(bestDiagnostic),
    diagnosticValidated: Boolean(bestDiagnostic?.validated),
    diagnosticThin: thin,
    missingFields,
    hasMarketResearch: marketRows.length > 0,
    goals: perspectiveGoals.length,
    actions: actionRows.length,
    proposals: proposalRows.length,
  });

  const cycleRun = client.cycleRun ?? { status: "idle" as const };
  const cycleRunning = cycleRun.status === "running";
  const canRunCycle = brief.recommendedAction === "ciclo" || brief.recommendedAction === "acompanhar";
  const canValidate = Boolean(bestDiagnostic && !thin && !bestDiagnostic.validated);

  const cycleBlocks = perspectiveGoals.map((goal) => {
    const kpis = indicatorRows.filter((row) => row.goalId === goal.id);
    const actions = actionRows.filter((row) => row.goalId === goal.id);
    const perspective = (kpis[0]?.perspective ?? actions[0]?.perspective ?? "financeira") as Perspective;
    return { goal, kpis, actions, perspective };
  });

  return (
    <>
      <PageHeader
        title={client.tradeName ?? client.name}
        description="Sua funcao: gravar a sessao, dar direcionamento, subir documento, validar o servico e acompanhar o desenvolvimento. O sistema opera o metodo."
        action={<LinkButton href={`/app/clients/${id}`}>Sala de gestao</LinkButton>}
      />
      <ClientWorkspaceNav clientId={id} current="operate" />

      <ClientFitBanner
        clientId={id}
        qualification={(client.salesQualification ?? {}) as SalesQualification}
        hasTranscript={sessionRows.some((row) => Boolean(row.transcriptRaw?.trim()))}
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">Apontamentos do sistema</p>
            <h2 className="mt-1 text-xl font-semibold text-[#012245]">
              {brief.recommendedLabel ?? "Grave a sessao ou envie um documento"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              {sessionRows.length} sessao(oes) · {documentRows.length} documento(s) · {goalRows.length} meta(s) ·{" "}
              {actionRows.length} acao(oes)
              {bestDiagnostic ? ` · diagnostico v${bestDiagnostic.version}${bestDiagnostic.validated ? " validado" : " em rascunho"}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canRunCycle ? (
              <OperateActionButton
                clientId={id}
                action="ciclo"
                locked={cycleRunning}
                label={
                  cycleRunning
                    ? "Ciclo em andamento..."
                    : brief.recommendedAction === "acompanhar"
                      ? "Processar de novo"
                      : "Processar ciclo ORBE"
                }
              />
            ) : null}
            {canValidate ? (
              <OperateActionButton clientId={id} action="validar" label="Validar o servico" variant="secondary" />
            ) : null}
          </div>
        </div>
        <CycleRunBanner cycleRun={cycleRun} />
        {marketRows[0] ? (
          <p className="mt-3 text-sm text-slate-600">
            Pesquisa R na gestao de planejamento desta empresa. Ultimo insight:{" "}
            {marketRows[0].summary.slice(0, 160)}
            {marketRows[0].summary.length > 160 ? "…" : ""}
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Pesquisa de mercado (Tavily + OpenRouter) roda neste botao. Sem chave, o ciclo aponta o buraco e nao
            inventa mercado.
          </p>
        )}
        <ul className="mt-6 grid gap-3">
          {brief.notes.map((note, index) => (
            <li key={`${note.phase}-${index}`} className={`rounded-2xl border px-4 py-3 ${PHASE_TONE[note.status]}`}>
              <p className="text-xs font-semibold uppercase tracking-wide">
                Fase {note.phase} · {note.status}
              </p>
              <p className="mt-1 font-semibold">{note.title}</p>
              <p className="mt-1 text-sm opacity-80">{note.detail}</p>
            </li>
          ))}
        </ul>
        {payload.gut?.length || payload.mix4p || payload.ishikawa ? (
          <div className="mt-5 grid gap-3 text-sm text-slate-700">
            {payload.gut?.length ? (
              <p>
                <strong>GUT:</strong> {payload.gut.slice(0, 3).map((item) => `${item.item} (${item.score ?? item.gravidade * item.urgencia * item.tendencia})`).join(" · ")}
              </p>
            ) : null}
            {payload.ishikawa?.problema ? (
              <p>
                <strong>Ishikawa:</strong> {payload.ishikawa.problema}
              </p>
            ) : null}
            {payload.mix4p ? (
              <p>
                <strong>4Ps:</strong>{" "}
                {["produto", "preco", "praca", "promocao"]
                  .map((key) => {
                    const field = payload.mix4p?.[key as keyof typeof payload.mix4p];
                    const value = field && typeof field === "object" ? field.value : field;
                    return value ? `${key}: ${value}` : null;
                  })
                  .filter(Boolean)
                  .join(" · ") || "ainda sem evidencia"}
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">1 · Gravar</p>
          <h2 className="mt-1 text-lg font-semibold text-[#012245]">Sessao com o cliente</h2>
          <SessionCreateForm
            clients={[{ id: client.id, name: client.name }]}
            lockedClientId={client.id}
            redirectTo={`/app/clients/${id}/operate`}
          />
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">2 · Documentos</p>
          <h2 className="mt-1 text-lg font-semibold text-[#012245]">Subir o que o cliente entregou</h2>
          <p className="mt-1 text-sm text-slate-500">DRE, contrato, organograma. Sem isso o sistema aponta o buraco — nao inventa numero.</p>
          <CockpitDocumentForm clientId={id} />
          {documentRows.some((doc) => doc.kind === "memoria") ? (
            <p className="mt-3 text-sm">
              <Link href={`/app/clients/${id}/memory`} className="font-semibold text-[#2e7271]">
                Dossie
              </Link>
              {" · relatos do mais novo ao mais velho; e o que o motor le"}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              O dossie aparece depois da primeira transcricao.{" "}
              <Link href={`/app/clients/${id}/memory`} className="font-semibold text-[#2e7271]">
                Abrir dossie
              </Link>
            </p>
          )}
          {documentRows.filter((doc) => doc.kind !== "memoria").length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {documentRows
                .filter((doc) => doc.kind !== "memoria")
                .slice(0, 6)
                .map((doc) => (
                  <li key={doc.id}>
                    {doc.title} · {DOCUMENT_KIND_LABELS[(doc.kind as DocumentKind) ?? "outro"] ?? doc.kind}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Inbox de documentos do cliente vazia.</p>
          )}
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">3 · Direcionar</p>
          <h2 className="mt-1 text-lg font-semibold text-[#012245]">Orientacao do consultor</h2>
          <p className="mt-1 text-sm text-slate-500">Correcoes, prioridades e o que nao pode ser inventado. Entra no proximo ciclo.</p>
          <ConsultantDirectionForm clientId={id} />
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">4 · Acompanhar o desenvolvimento</p>
            <h2 className="mt-1 text-lg font-semibold text-[#012245]">Ciclo preenchido nesta empresa</h2>
            <p className="mt-1 text-sm text-slate-500">
              Metas globais e as quatro perspectivas (financeira, comercial, processos, recursos). Acao em 5W2H.
            </p>
          </div>
          {bestDiagnostic ? (
            <Link href={`/app/diagnostics/${bestDiagnostic.id}`} className="text-sm font-semibold text-[#2e7271]">
              Abrir diagnostico v{bestDiagnostic.version}
            </Link>
          ) : null}
        </div>

        {globalGoals.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-[#2e7271]/20 bg-[#2e7271]/5 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2e7271]">Metas globais</p>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-[#012245]">
              {globalGoals.map((goal) => (
                <li key={goal.id}>
                  <strong>{goal.title}</strong>
                  {goal.notes ? (
                    <span className="mt-0.5 block text-slate-500">{goal.notes.replace("[global]", "").trim()}</span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {cycleBlocks.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Ainda nao ha metas por perspectiva. Grave ou processe o ciclo — o sistema preenche as 4 perspectivas e ate 6 globais.
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            {cycleBlocks.map(({ goal, kpis, actions, perspective }) => (
              <section key={goal.id} className="rounded-2xl border border-slate-100 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2e7271]">
                  {PERSPECTIVE_LABELS_DANIEL[perspective] ?? perspective}
                </p>
                <h3 className="mt-1 font-semibold text-[#012245]">{goal.title}</h3>
                {goal.notes ? <p className="mt-1 text-sm text-slate-500">{goal.notes}</p> : null}
                {kpis.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm text-slate-700">
                    {kpis.map((kpi) => {
                      const numbered = Object.values(kpi.planned ?? {}).filter((value) => value != null);
                      return (
                        <li key={kpi.id}>
                          <strong>KPI:</strong> {kpi.name} ({kpi.unit}, {kpi.direction})
                          {numbered.length
                            ? ` · ${numbered.length} mes(es) planejado(s)`
                            : " · sem numero — falta evidencia (DRE/sessao)"}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                {actions.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {actions.map((action) => (
                      <li key={action.id} className="rounded-xl bg-[#f7f4ee] px-3 py-2">
                        <strong className="text-[#012245]">{action.title}</strong>
                        {action.how ? <span className="mt-0.5 block text-slate-600">{action.how}</span> : null}
                        <span className="mt-0.5 block text-slate-500">
                          {action.ownerName ?? "Dono a definir"}
                          {action.sector ? ` · ${action.sector}` : ""}
                          {` · ${action.status}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">Sem acao nesta meta — processe o ciclo.</p>
                )}
              </section>
            ))}
          </div>
        )}

        {proposalRows[0] ? (
          <p className="mt-4 text-sm">
            <Link href={`/app/clients/${id}/proposals`} className="font-semibold text-[#2e7271]">
              Proposta: {proposalRows[0].title}
            </Link>
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-[#012245]">Material ja no nucleo</h2>
        <p className="mt-1 text-sm text-slate-500">O ciclo le tudo isto. Nao precisa preencher ficha a mao.</p>
        {sessionRows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Nenhuma sessao ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sessionRows.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/app/sessions/${session.id}`}
                  className="block rounded-xl border border-slate-100 px-3 py-2 text-sm hover:bg-[#f7f4ee]"
                >
                  <strong className="text-[#012245]">{session.title}</strong>
                  <span className="mt-0.5 block text-slate-500">
                    {session.status}
                    {session.transcriptRaw?.trim() ? " · com transcricao" : " · sem transcricao"}
                    {" · "}
                    {formatDateTime(session.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
