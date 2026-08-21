import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Card, PageHeader } from "@/components/ui";
import { WorkingCapitalForm } from "@/components/WorkingCapitalForm";
import { clientArtifacts, clients, db } from "@/lib/db";
import type { WorkingCapitalInput, WorkingCapitalResult } from "@/lib/finance/working-capital";
import { getCurrentOrg } from "@/lib/org";
import { saveWorkingCapital } from "../../../../actions";

export default async function WorkingCapitalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.organizationId, orgId)))
    .limit(1);
  if (!client) notFound();

  const [artifact] = await db
    .select()
    .from(clientArtifacts)
    .where(
      and(
        eq(clientArtifacts.clientId, id),
        eq(clientArtifacts.organizationId, orgId),
        eq(clientArtifacts.kind, "working_capital"),
      ),
    )
    .orderBy(desc(clientArtifacts.createdAt))
    .limit(1);

  const initial = artifact?.payload as { input: WorkingCapitalInput; result: WorkingCapitalResult } | undefined;

  return (
    <>
      <PageHeader
        title={`Capital de giro — ${client.name}`}
        description="Fase O/R: estoque, prazos e necessidade de capital de giro (NCG)."
      />
      <Card>
        <WorkingCapitalForm
          clientName={client.name}
          action={saveWorkingCapital.bind(null, id)}
          initial={initial}
        />
      </Card>
    </>
  );
}
