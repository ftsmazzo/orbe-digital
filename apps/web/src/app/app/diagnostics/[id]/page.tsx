import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { DiagnosticEditor } from "@/components/DiagnosticEditor";
import { PageHeader } from "@/components/ui";
import { clients, db, diagnostics } from "@/lib/db";
import type { DiagnosticPayload } from "@orbe/shared";
import { getCurrentOrg } from "@/lib/org";
import { saveDiagnostic, validateDiagnostic, draftPlanFromDiagnostic } from "../../actions";

export default async function DiagnosticDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [diagnostic] = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.id, id), eq(diagnostics.organizationId, orgId)))
    .limit(1);
  if (!diagnostic) notFound();
  const [client] = await db.select().from(clients).where(eq(clients.id, diagnostic.clientId)).limit(1);

  return (
    <>
      <PageHeader
        title={`Diagnostico ORBE v${diagnostic.version}`}
        description={`${client?.name ?? "Cliente"} · ${diagnostic.validated ? "versao validada" : "rascunho editavel"}`}
        action={
          client ? (
            <Link
              href={`/app/clients/${client.id}`}
              className="rounded-xl border border-[#012245]/15 px-4 py-2 text-sm font-semibold text-[#012245]"
            >
              Voltar ao cliente
            </Link>
          ) : null
        }
      />
      <DiagnosticEditor
        diagnosticId={diagnostic.id}
        version={diagnostic.version}
        maturity={diagnostic.maturity}
        gaps={diagnostic.gaps}
        priorities={diagnostic.priorities}
        risks={diagnostic.risks}
        openQuestions={diagnostic.openQuestions}
        payload={(diagnostic.payload ?? {}) as DiagnosticPayload}
        validated={diagnostic.validated}
        saveAction={saveDiagnostic.bind(null, id)}
        validateAction={validateDiagnostic.bind(null, id)}
        draftPlanAction={draftPlanFromDiagnostic.bind(null, id)}
        planningHref={client ? `/app/clients/${client.id}/planning` : "/app/clients"}
      />
    </>
  );
}
