import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { PERSPECTIVE_LABELS, PERSPECTIVES } from "@orbe/shared";
import { Card, PageHeader } from "@/components/ui";
import { actionItems, clients, db, indicators } from "@/lib/db";
import { formatDate, pct } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";

function hasMonthValue(record: Record<string, number | null> | null | undefined) {
  return Object.values(record ?? {}).some((value) => value != null && Number(value) !== 0);
}

function progress(planned: Record<string, number | null>, actual: Record<string, number | null>) {
  const plannedTotal = Object.values(planned ?? {}).reduce<number>((sum, value) => sum + (Number(value) || 0), 0);
  const actualTotal = Object.values(actual ?? {}).reduce<number>((sum, value) => sum + (Number(value) || 0), 0);
  if (!plannedTotal) return null;
  return Math.min(150, (actualTotal / plannedTotal) * 100);
}

function progressLabel(planned: Record<string, number | null>, actual: Record<string, number | null>) {
  const value = progress(planned, actual);
  if (value == null) {
    return hasMonthValue(actual)
      ? "Realizado sem meta — falta DRE ou numero na sessao"
      : "Sem meta numerica — falta DRE ou numero na sessao";
  }
  if (!hasMonthValue(actual)) return "Meta sem realizado";
  return pct(value);
}

export default async function ClientDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) notFound();
  const [indicatorRows, actionRows] = await Promise.all([
    db.select().from(indicators).where(and(eq(indicators.clientId, id), eq(indicators.organizationId, orgId))),
    db.select().from(actionItems).where(and(eq(actionItems.clientId, id), eq(actionItems.organizationId, orgId))),
  ]);
  const overdue = actionRows.filter((action) => action.status === "atrasado" || (action.dueDate && action.dueDate < new Date() && action.status !== "concluido"));
  const completed = actionRows.filter((action) => action.status === "concluido").length;

  const bsc = PERSPECTIVES.map((perspective) => {
    const items = indicatorRows.filter((i) => i.perspective === perspective);
    const scored = items
      .map((item) => progress(item.planned, item.actual))
      .filter((value): value is number => value != null);
    const avg = scored.length === 0 ? null : scored.reduce((sum, value) => sum + value, 0) / scored.length;
    return { perspective, items, avg };
  });

  return (
    <>
      <PageHeader
        title={`Dashboard - ${client.name}`}
        description="Mapa BSC: planejado x realizado. 0% so aparece quando ha meta numerica e realizado zero — sem DRE o indicador fica sem porcentagem."
        action={
          <a className="rounded-xl bg-[#012245] px-4 py-2 text-sm font-semibold text-white" href={`/print/dashboard/${id}`}>
            Imprimir PDF
          </a>
        }
      />
      <div className="grid gap-6 md:grid-cols-3">
        <Card><p className="text-sm text-slate-500">Indicadores</p><strong className="mt-2 block text-3xl text-[#012245]">{indicatorRows.length}</strong></Card>
        <Card><p className="text-sm text-slate-500">Acoes concluidas</p><strong className="mt-2 block text-3xl text-[#2e7271]">{completed}</strong></Card>
        <Card><p className="text-sm text-slate-500">Acoes em atraso</p><strong className="mt-2 block text-3xl text-red-700">{overdue.length}</strong></Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-[#012245]">Mapa BSC</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {bsc.map((block) => (
            <div key={block.perspective} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between gap-2">
                <strong>{PERSPECTIVE_LABELS[block.perspective]}</strong>
                <span className="text-sm text-slate-500">
                  {block.avg == null ? "sem meta numerica" : pct(block.avg)} · {block.items.length} KPI(s)
                </span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-[#c8a04c]" style={{ width: `${Math.min(100, block.avg ?? 0)}%` }} />
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {block.items.slice(0, 4).map((i) => (
                  <li key={i.id}>
                    {i.name} — {progressLabel(i.planned, i.actual)}
                  </li>
                ))}
                {!block.items.length ? <li className="text-slate-400">Sem indicadores nesta perspectiva.</li> : null}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Progresso dos indicadores</h2>
          <div className="mt-4 grid gap-4">
            {indicatorRows.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum indicador ainda. Rode o ciclo com sessao transcrita.</p>
            ) : null}
            {indicatorRows.map((indicator) => {
              const value = progress(indicator.planned, indicator.actual);
              return (
                <div key={indicator.id}>
                  <div className="flex justify-between gap-3 text-sm">
                    <strong>{indicator.name}</strong>
                    <span>{PERSPECTIVE_LABELS[indicator.perspective]} · {progressLabel(indicator.planned, indicator.actual)}</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-[#c8a04c]" style={{ width: `${Math.min(100, value ?? 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Atrasos e riscos</h2>
          <div className="mt-4 grid gap-3">
            {overdue.map((action) => (
              <div key={action.id} className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm">
                <strong>{action.title}</strong>
                <p className="text-red-700">Prazo: {formatDate(action.dueDate)} · {action.ownerName ?? "Sem responsavel"}</p>
              </div>
            ))}
            {!overdue.length ? <p className="text-sm text-slate-500">Nenhuma acao atrasada.</p> : null}
          </div>
        </Card>
      </div>
    </>
  );
}
