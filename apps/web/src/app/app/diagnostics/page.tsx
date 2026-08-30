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

  return (
    <>
      <PageHeader
        title="Diagnosticos"
        description="Cada versao permanece (auditoria). Abra pelo nome da empresa — nao por um v1 solto."
      />
      <Card>
        <div className="grid gap-3">
          {rows.length === 0 ? (
            <p className="mt-1 text-sm text-slate-600">
              Nenhum diagnostico ainda. Use{" "}
              <Link href="/app/operate" className="font-semibold text-[#2e7271] hover:underline">
                Operacao
              </Link>{" "}
              para gravar e processar o ciclo.
            </p>
          ) : (
            rows.map((diagnostic) => (
              <Link
                key={diagnostic.id}
                href={`/app/diagnostics/${diagnostic.id}`}
                className="rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-[#012245]">
                    {diagnostic.tradeName ?? diagnostic.clientName ?? "Empresa sem cadastro"}
                  </strong>
                  <span className="rounded-full bg-[#c8a04c]/15 px-3 py-1 text-xs font-semibold text-[#012245]">
                    v{diagnostic.version} · {diagnostic.validated ? "Validado" : "Rascunho"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Maturidade {diagnostic.maturity ?? "-"} · {formatDateTime(diagnostic.createdAt)}
                </p>
              </Link>
            ))
          )}
        </div>
      </Card>
    </>
  );
}
