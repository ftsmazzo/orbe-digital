import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ACTION_STATUS_LABELS, PERSPECTIVE_LABELS_DANIEL, type ActionStatus, type Perspective } from "@orbe/shared";
import { ClientWorkspaceNav } from "@/components/ClientWorkspaceNav";
import { Card, CardTitle, EmptyNote, PageHeader } from "@/components/ui";
import { currentMonthKey, currentMonthLabel, isActionOverdue, monthValue, sortByDue } from "@/lib/actions/pulse";
import { stampMissingActionDates } from "@/lib/actions/stamp-dates";
import { actionItems, clients, db, indicators } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";

export default async function ClientDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) notFound();

  await stampMissingActionDates(orgId, id);

  const [indicatorRows, actionRows] = await Promise.all([
    db.select().from(indicators).where(and(eq(indicators.clientId, id), eq(indicators.organizationId, orgId))),
    db.select().from(actionItems).where(and(eq(actionItems.clientId, id), eq(actionItems.organizationId, orgId))),
  ]);

  const month = currentMonthKey();
  const open = sortByDue(actionRows.filter((action) => action.status !== "concluido"));
  const overdue = open.filter(isActionOverdue);
  const next = open.slice(0, 6);
  const completed = actionRows.filter((action) => action.status === "concluido").length;
  const monthKpis = indicatorRows.map((indicator) => ({
    id: indicator.id,
    name: indicator.name,
    perspective: indicator.perspective as Perspective,
    plan: monthValue(indicator.planned, month),
    real: monthValue(indicator.actual, month),
  }));

  return (
    <>
      <PageHeader
        title={`Dashboard · ${client.tradeName ?? client.name}`}
        description={`O que vence e o pulso de ${currentMonthLabel()}. Sem DRE o planejado fica vazio.`}
        action={
          <a className="rounded-xl bg-[#012245] px-4 py-2 text-sm font-semibold text-white" href={`/print/dashboard/${id}`}>
            Imprimir PDF
          </a>
        }
      />
      <ClientWorkspaceNav clientId={id} current="dashboard" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">A fazer</p>
          <strong className="mt-2 block text-3xl text-[#012245]">{open.length}</strong>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Atrasadas</p>
          <strong className="mt-2 block text-3xl text-red-700">{overdue.length}</strong>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Concluidas</p>
          <strong className="mt-2 block text-3xl text-[#2e7271]">{completed}</strong>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle
            kicker="Agenda"
            title="Proximas acoes"
            hint="Prazo que o ciclo calculou. Voce so move o status."
          />
          {next.length === 0 ? (
            <EmptyNote>Nenhuma acao aberta. Rode o ciclo na Operacao.</EmptyNote>
          ) : (
            <ol className="grid gap-3">
              {next.map((action) => (
                <li key={action.id} className={`rounded-2xl border px-4 py-3 ${isActionOverdue(action) ? "border-red-200 bg-red-50" : "border-slate-100"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <strong className="min-w-0 text-[#012245]">{action.title}</strong>
                    <span className={`shrink-0 text-sm font-semibold ${isActionOverdue(action) ? "text-red-700" : "text-[#012245]"}`}>
                      {formatDate(action.dueDate)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {action.ownerName ?? "Sem dono"}
                    {action.perspective ? ` · ${PERSPECTIVE_LABELS_DANIEL[action.perspective as Perspective]}` : ""}
                    {action.businessDays ? ` · ${action.businessDays} du` : ""}
                    {` · ${ACTION_STATUS_LABELS[action.status as ActionStatus]}`}
                  </p>
                </li>
              ))}
            </ol>
          )}
          <Link href={`/app/clients/${id}/actions`} className="mt-4 inline-block text-sm font-semibold text-[#2e7271]">
            Abrir acoes
          </Link>
        </Card>

        <Card>
          <CardTitle kicker="Pulso" title={currentMonthLabel()} hint="Informe o realizado no planejamento." />
          {monthKpis.length === 0 ? (
            <EmptyNote>Sem KPI ainda.</EmptyNote>
          ) : (
            <ul className="grid gap-3">
              {monthKpis.map((kpi) => {
                const pct = kpi.plan && kpi.real != null ? Math.round((kpi.real / kpi.plan) * 100) : null;
                return (
                  <li key={kpi.id}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <strong className="text-[#012245]">{kpi.name}</strong>
                        <span className="ml-2 text-xs text-slate-500">{PERSPECTIVE_LABELS_DANIEL[kpi.perspective]}</span>
                      </span>
                      <span className="shrink-0 text-slate-600">
                        {kpi.plan == null && kpi.real == null
                          ? "sem numero"
                          : `${kpi.real ?? "—"} / ${kpi.plan ?? "—"}`}
                        {pct != null ? ` · ${pct}%` : ""}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-[#c8a04c]" style={{ width: `${Math.min(100, pct ?? 0)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href={`/app/clients/${id}/planning`} className="mt-4 inline-block text-sm font-semibold text-[#2e7271]">
            Informar realizado
          </Link>
        </Card>
      </div>
    </>
  );
}
