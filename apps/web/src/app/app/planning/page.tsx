import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Card, CardTitle, EmptyNote, PageHeader } from "@/components/ui";
import { currentMonthKey, currentMonthLabel, monthValue } from "@/lib/actions/pulse";
import { clients, db, indicators } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";

export default async function PlanningIndexPage() {
  const { orgId } = await getCurrentOrg();
  const [rows, indicatorRows] = await Promise.all([
    db.select().from(clients).where(eq(clients.organizationId, orgId)).orderBy(desc(clients.updatedAt)),
    db.select().from(indicators).where(eq(indicators.organizationId, orgId)),
  ]);
  const byClient = new Map(rows.map((client) => [client.id, client.tradeName ?? client.name]));
  const month = currentMonthKey();

  return (
    <>
      <PageHeader title="Planejamento" description={`Informe o realizado de ${currentMonthLabel()}.`} />

      <Card>
        <CardTitle kicker="Este mes" title={currentMonthLabel()} />
        {indicatorRows.length === 0 ? (
          <EmptyNote>Sem KPI ainda. Processe o ciclo na Operacao.</EmptyNote>
        ) : (
          <ul className="grid gap-2">
            {indicatorRows.map((indicator) => {
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
