import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Card, PageHeader } from "@/components/ui";
import { db, diagnostics } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";

export default async function DiagnosticsPage() {
  const { orgId } = await getCurrentOrg();
  const rows = await db
    .select()
    .from(diagnostics)
    .where(eq(diagnostics.organizationId, orgId))
    .orderBy(desc(diagnostics.createdAt));

  return (
    <>
      <PageHeader
        title="Diagnosticos"
        description="Revise rascunhos extraidos das sessoes e valide versoes do diagnostico ORBE."
      />
      <Card>
        <div className="grid gap-3">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-600">
              Nenhum diagnostico ainda. Abra uma{" "}
              <Link href="/app/sessions" className="font-semibold text-[#2e7271] hover:underline">
                sessao
              </Link>{" "}
              e cole a transcricao para gerar o primeiro rascunho.
            </p>
          ) : (
            rows.map((diagnostic) => (
              <Link
                key={diagnostic.id}
                href={`/app/diagnostics/${diagnostic.id}`}
                className="rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-[#012245]">Diagnostico v{diagnostic.version}</strong>
                  <span className="rounded-full bg-[#c8a04c]/15 px-3 py-1 text-xs font-semibold text-[#012245]">
                    {diagnostic.validated ? "Validado" : "Rascunho"}
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
