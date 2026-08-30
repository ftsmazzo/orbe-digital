import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Card, CardTitle, EmptyNote, PageHeader } from "@/components/ui";
import { isActionOverdue, sortByDue } from "@/lib/actions/pulse";
import { stampMissingActionDates } from "@/lib/actions/stamp-dates";
import { actionItems, clients, db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";

export default async function ActionsIndexPage() {
  const { orgId } = await getCurrentOrg();
  await stampMissingActionDates(orgId);

  const [rows, actionRows] = await Promise.all([
    db.select().from(clients).where(eq(clients.organizationId, orgId)).orderBy(desc(clients.updatedAt)),
    db.select().from(actionItems).where(eq(actionItems.organizationId, orgId)),
  ]);
  const byClient = new Map(rows.map((client) => [client.id, client.tradeName ?? client.name]));
  const open = sortByDue(actionRows.filter((action) => action.status !== "concluido"));

  return (
    <>
      <PageHeader title="Acoes" description="Todas as acoes abertas, com o prazo que o ciclo gravou." />

      <Card>
        <CardTitle title="Em curso" hint={`${open.length} abertas`} />
        {open.length === 0 ? (
          <EmptyNote>Nenhuma acao aberta. Processe o ciclo na Operacao.</EmptyNote>
        ) : (
          <ol className="grid gap-3">
            {open.map((action) => (
              <li key={action.id} className={`rounded-2xl border px-4 py-3 ${isActionOverdue(action) ? "border-red-200 bg-red-50" : "border-slate-100"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/app/clients/${action.clientId}/actions`} className="font-semibold text-[#012245] hover:underline">
                      {action.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {byClient.get(action.clientId) ?? "Cliente"}
                      {action.ownerName ? ` · ${action.ownerName}` : ""}
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
    </>
  );
}
