import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Card, PageHeader } from "@/components/ui";
import { ValuationForm } from "@/components/ValuationForm";
import { clientArtifacts, clients, db } from "@/lib/db";
import type { ValuationInput, ValuationResult } from "@/lib/finance/valuation";
import { getCurrentOrg } from "@/lib/org";
import { saveValuation } from "../../../../actions";

export default async function ValuationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.organizationId, orgId)))
    .limit(1);
  if (!client) notFound();

  const [valuation, wc, payroll] = await Promise.all([
    db
      .select()
      .from(clientArtifacts)
      .where(
        and(
          eq(clientArtifacts.clientId, id),
          eq(clientArtifacts.organizationId, orgId),
          eq(clientArtifacts.kind, "valuation"),
        ),
      )
      .orderBy(desc(clientArtifacts.createdAt))
      .limit(1),
    db
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
      .limit(1),
    db
      .select()
      .from(clientArtifacts)
      .where(
        and(
          eq(clientArtifacts.clientId, id),
          eq(clientArtifacts.organizationId, orgId),
          eq(clientArtifacts.kind, "payroll_cost"),
        ),
      )
      .orderBy(desc(clientArtifacts.createdAt))
      .limit(1),
  ]);

  const initial = valuation[0]?.payload as { input: ValuationInput; result: ValuationResult } | undefined;
  const wcResult = (wc[0]?.payload as { result?: { totalNeed?: number } } | undefined)?.result;
  const payrollResult = (payroll[0]?.payload as { result?: { monthlyEmployerCost?: number } } | undefined)?.result;

  return (
    <>
      <PageHeader
        title={`Valuation — ${client.name}`}
        description="Fase R: projecao 12 meses com VPL, TIR e payback. Reusa CG e folha light quando existirem."
      />
      <Card>
        <ValuationForm
          action={saveValuation.bind(null, id)}
          initial={initial}
          suggestedPayroll={payrollResult?.monthlyEmployerCost ?? 0}
          suggestedWorkingCapital={wcResult?.totalNeed ?? 0}
        />
      </Card>
    </>
  );
}
