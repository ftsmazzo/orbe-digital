import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Card, PageHeader } from "@/components/ui";
import { clients, db } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";

export default async function DashboardIndexPage() {
  const { orgId } = await getCurrentOrg();
  const rows = await db.select().from(clients).where(eq(clients.organizationId, orgId)).orderBy(desc(clients.updatedAt));

  return (
    <>
      <PageHeader title="Dashboard" description="Escolha um cliente para ver indicadores e riscos de execucao." />
      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((client) => (
            <Link key={client.id} href={`/app/clients/${client.id}/dashboard`} className="rounded-2xl border border-slate-100 p-4 font-semibold text-[#012245] hover:bg-slate-50">
              {client.name}
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}
