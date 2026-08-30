import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { PERSPECTIVE_LABELS_DANIEL, type Perspective } from "@orbe/shared";
import { Card, CardTitle, EmptyNote, PageHeader } from "@/components/ui";
import { currentMonthKey, currentMonthLabel, isActionOverdue, monthValue, sortByDue } from "@/lib/actions/pulse";
import { stampMissingActionDates } from "@/lib/actions/stamp-dates";
import { actionItems, clients, db, indicators } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";

export default async function DashboardIndexPage() {
  const { orgId } = await getCurrentOrg();
  await stampMissingActionDates(orgId);

  const [rows, actionRows, indicatorRows] = await Promise.all([
    db.select().from(clients).where(eq(clients.organizationId, orgId)).orderBy(desc(clients.updatedAt)),
    db.select().from(actionItems).where(eq(actionItems.organizationId, orgId)),
    db.select().from(indicators).where(eq(indicators.organizationId, orgId)),
  ]);

  const byClient = new Map(rows.map((client) => [client.id, client.tradeName ?? client.name]));
  const open = sortByDue(actionRows.filter((action) => action.status !== "concluido"));
  const overdue = open.filter(isActionOverdue);
  const next = open.slice(0, 8);
  const month = currentMonthKey();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`O que vence agora e o pulso de ${currentMonthLabel()}.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Acoes abertas</p>
          <strong className="mt-2 block text-3xl text-[#012245]">{open.length}</strong>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Atrasadas</p>
          <strong className="mt-2 block text-3xl text-red-700">{overdue.length}</strong>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Clientes</p>
          <strong className="mt-2 block text-3xl text-[#012245]">{rows.length}</strong>
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle kicker="Agenda" title="Proximas acoes" hint="Prazo que o ciclo gravou. Entre no cliente para mover." />
        {next.length === 0 ? (
          <EmptyNote>Nenhuma acao aberta. Processe o ciclo na Operacao.</EmptyNote>
        ) : (
          <ol className="grid gap-3">
            {next.map((action) => (
              <li key={action.id} className={`rounded-2xl border px-4 py-3 ${isActionOverdue(action) ? "border-red-200 bg-red-50" : "border-slate-100"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/app/clients/${action.clientId}/actions`} className="font-semibold text-[#012245] hover:underline">
                      {action.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {byClient.get(action.clientId) ?? "Cliente"}
                      {action.ownerName ? ` · ${action.ownerName}` : ""}
                      {action.perspective ? ` · ${PERSPECTIVE_LABELS_DANIEL[action.perspective as Perspective]}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold ${isActionOverdue(action) ? "text-red-700" : "text-[#012245]"}`}>
                    {formatDate(action.dueDate)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card className="mt-6">
        <CardTitle kicker="Pulso" title={currentMonthLabel()} />
        {indicatorRows.length === 0 ? (
          <EmptyNote>Sem KPI ainda.</EmptyNote>
        ) : (
          <ul className="grid gap-2">
            {indicatorRows.slice(0, 10).map((indicator) => {
              const plan = monthValue(indicator.planned, month);
              const real = monthValue(indicator.actual, month);
              return (
                <li key={indicator.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 px-4 py-3 text-sm">
                  <span className="min-w-0">
                    <Link href={`/app/clients/${indicator.clientId}/planning`} className="font-semibold text-[#012245] hover:underline">
                      {indicator.name}
                    </Link>
                    <span className="ml-2 text-xs text-slate-500">{byClient.get(indicator.clientId)}</span>
                  </span>
                  <span className="text-slate-600">
                    {plan == null && real == null ? "sem numero" : `${real ?? "—"} / ${plan ?? "—"}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
