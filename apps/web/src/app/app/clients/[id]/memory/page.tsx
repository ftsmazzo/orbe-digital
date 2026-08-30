import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ClientWorkspaceNav } from "@/components/ClientWorkspaceNav";
import { MemoryMarkdown } from "@/components/MemoryMarkdown";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { clients, db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";
import { ensureSessionMemory } from "@/lib/sessions/session-memory";

export default async function ClientMemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) notFound();

  const memory = await ensureSessionMemory({
    orgId,
    clientId: id,
    clientName: client.name,
  });
  const payload = (memory?.payload ?? {}) as { sessionCount?: number };

  return (
    <>
      <PageHeader
        title="Memoria das sessoes"
        description={`${client.tradeName ?? client.name} · documento vivo em markdown. Fit e ciclo leem daqui.`}
        action={<LinkButton href={`/app/clients/${id}/operate`}>Voltar a operar</LinkButton>}
      />
      <ClientWorkspaceNav clientId={id} current="memory" />
      <Card>
        <p className="text-sm text-slate-500">
          {payload.sessionCount ?? 0} sessao(oes) no acervo
          {memory?.updatedAt ? ` · atualizado ${formatDateTime(memory.updatedAt)}` : ""}
        </p>
        <div className="mt-5">
          {memory?.extractedText?.trim() ? (
            <MemoryMarkdown markdown={memory.extractedText} />
          ) : (
            <p className="text-sm text-slate-500">Ainda nao ha transcricao. Grave ou cole uma sessao no cockpit.</p>
          )}
        </div>
      </Card>
    </>
  );
}
