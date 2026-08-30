import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Card, PageHeader } from "@/components/ui";
import { clients, db } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";

export default async function ProposalsIndexPage() {
  const { orgId } = await getCurrentOrg();
  const rows = await db.select().from(clients).where(eq(clients.organizationId, orgId)).orderBy(desc(clients.updatedAt));

  return (
    <>
      <PageHeader title="Propostas" description="Sala de gestao. A peca nasce no ciclo; aqui voce revisa." />
      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((client) => (
            <div key={client.id} className="rounded-2xl border border-slate-100 p-4">
              <Link href={`/app/clients/${client.id}/proposals`} className="font-semibold text-[#012245] hover:underline">
                {client.tradeName ?? client.name}
              </Link>
              <p className="mt-2 text-sm">
                <Link href={`/app/clients/${client.id}/operate`} className="font-semibold text-[#2e7271]">
                  Operar
                </Link>
              </p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
