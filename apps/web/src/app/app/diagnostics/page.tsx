import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Card, PageHeader } from "@/components/ui";
import { clients, db, diagnostics } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";

export default async function DiagnosticsPage() {
  const { orgId } = await getCurrentOrg();
  const rows = await db
    .select({
      id: diagnostics.id,
      version: diagnostics.version,
      validated: diagnostics.validated,
      maturity: diagnostics.maturity,
      createdAt: diagnostics.createdAt,
      clientId: diagnostics.clientId,
      clientName: clients.name,
      tradeName: clients.tradeName,
    })
    .from(diagnostics)
    .leftJoin(clients, eq(clients.id, diagnostics.clientId))
    .where(eq(diagnostics.organizationId, orgId))
    .orderBy(desc(diagnostics.createdAt));

  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.clientId ?? "sem-cliente";
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  return (
    <>
      <PageHeader
        title="Diagnosticos"
        description="Agrupado por empresa. Versoes antigas ficam para auditoria — o ciclo usa a melhor."
      />
      {groups.size === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">
            Nenhum diagnostico ainda. Use{" "}
            <Link href="/app/operate" className="font-semibold text-[#2e7271] hover:underline">
              Operacao
            </Link>
            .
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {[...groups.values()].map((list) => {
            const head = list[0]!;
            const label = head.tradeName ?? head.clientName ?? "Empresa sem cadastro";
            return (
              <Card key={head.clientId ?? head.id}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[#012245]">{label}</h2>
                  {head.clientId ? (
                    <Link href={`/app/clients/${head.clientId}/operate`} className="text-sm font-semibold text-[#2e7271]">
                      Operar
                    </Link>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3">
                  {list.map((diagnostic) => (
                    <Link
                      key={diagnostic.id}
                      href={`/app/diagnostics/${diagnostic.id}`}
                      className="rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-[#012245]">Versao {diagnostic.version}</strong>
                        <span className="rounded-full bg-[#c8a04c]/15 px-3 py-1 text-xs font-semibold text-[#012245]">
                          {diagnostic.validated ? "Validado" : "Rascunho"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        Maturidade {diagnostic.maturity ?? "-"} · {formatDateTime(diagnostic.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
