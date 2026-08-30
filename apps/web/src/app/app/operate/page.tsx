import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { CRM_STAGE_LABELS } from "@orbe/shared";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { clients, db } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";

export default async function OperateHubPage() {
  const { orgId } = await getCurrentOrg();
  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.organizationId, orgId))
    .orderBy(desc(clients.updatedAt));

  return (
    <>
      <PageHeader
        title="Operacao"
        description="Grave, oriente, suba documento, valide e acompanhe. O sistema opera o metodo ORBE."
      />
      {rows.length === 0 ? (
        <Card>
          <h2 className="font-semibold text-[#012245]">Nenhum cliente ainda</h2>
          <p className="mt-2 text-sm text-slate-600">Crie o primeiro cliente para abrir o cockpit.</p>
          <div className="mt-4">
            <LinkButton href="/app/clients">Ir para clientes</LinkButton>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((client) => (
            <Card key={client.id}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">
                {CRM_STAGE_LABELS[client.stage]}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[#012245]">{client.tradeName ?? client.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{client.sector ?? "Setor nao informado"}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <LinkButton href={`/app/clients/${client.id}/operate`}>Operar</LinkButton>
                <Link href={`/app/clients/${client.id}`} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#2e7271]">
                  Gestao
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
