import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { clientContracts, clients, db } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";
import { generateClientContract } from "../../../actions";

export default async function ContractsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) notFound();
  const rows = await db
    .select()
    .from(clientContracts)
    .where(and(eq(clientContracts.clientId, id), eq(clientContracts.organizationId, orgId)))
    .orderBy(desc(clientContracts.createdAt));

  return (
    <>
      <PageHeader
        title={`Contratos — ${client.name}`}
        description="Rascunho a partir do modelo Soluciona (15% EBITDA, obrigacao de meio)."
      />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="font-semibold text-[#012245]">Gerar rascunho</h2>
          <form action={generateClientContract.bind(null, id)} className="mt-4 grid gap-3">
            <Field label="Inicio da cobranca">
              <Select name="billingStart" defaultValue="m6">
                <option value="m6">Carencia 6 meses (padrao Soluciona)</option>
                <option value="m1">Pagar desde o 1o mes</option>
              </Select>
            </Field>
            <Field label="Data de inicio">
              <Input name="startDate" type="date" />
            </Field>
            <Button>Gerar contrato (PDF via impressao)</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-semibold text-[#012245]">Versoes</h2>
          {rows.map((c) => (
            <a
              key={c.id}
              href={`/print/contract/${c.id}`}
              className="mt-3 block rounded-2xl border border-slate-100 p-3 text-sm hover:bg-slate-50"
            >
              {c.title} · {c.status}
            </a>
          ))}
        </Card>
      </div>
    </>
  );
}
