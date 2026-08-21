import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { clientPeople, clients, db } from "@/lib/db";
import { computePayrollCost } from "@/lib/finance/payroll-cost";
import { getCurrentOrg } from "@/lib/org";
import { addClientPerson, removeClientPerson } from "../../../../actions";

export default async function PayrollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.organizationId, orgId)))
    .limit(1);
  if (!client) notFound();

  const people = await db
    .select()
    .from(clientPeople)
    .where(and(eq(clientPeople.clientId, id), eq(clientPeople.organizationId, orgId)))
    .orderBy(desc(clientPeople.createdAt));

  const result = computePayrollCost(
    people.map((p) => ({
      name: p.name,
      role: p.role ?? undefined,
      team: p.team ?? undefined,
      salaryBase: Number(p.salaryBase ?? 0),
      employerCostFactor: Number(p.employerCostFactor ?? 1.7),
      active: p.active,
    })),
  );

  const teams = client.teams?.length ? client.teams : ["Geral"];

  return (
    <>
      <PageHeader
        title={`Folha light — ${client.name}`}
        description="Custo empregador estimado (sem recibos/eSocial). Alimenta valuation e KPIs."
      />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Novo colaborador</h2>
          <form action={addClientPerson.bind(null, id)} className="mt-4 grid gap-3">
            <Field label="Nome"><Input name="name" required /></Field>
            <Field label="Cargo"><Input name="role" /></Field>
            <Field label="Equipe">
              <Select name="team">
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Salario base"><Input name="salaryBase" type="number" step="0.01" required /></Field>
            <Field label="Fator encargos (ex. 1.7)"><Input name="employerCostFactor" type="number" step="0.01" defaultValue="1.7" /></Field>
            <Button>Adicionar</Button>
          </form>
        </Card>
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-sm text-slate-500">Headcount</p>
              <strong className="mt-2 block text-3xl text-[#012245]">{result.headcount}</strong>
            </Card>
            <Card>
              <p className="text-sm text-slate-500">Custo mensal empregador</p>
              <strong className="mt-2 block text-2xl text-[#2e7271]">
                R$ {result.monthlyEmployerCost.toLocaleString("pt-BR")}
              </strong>
            </Card>
            <Card>
              <p className="text-sm text-slate-500">Custo anual</p>
              <strong className="mt-2 block text-2xl text-[#012245]">
                R$ {result.annualEmployerCost.toLocaleString("pt-BR")}
              </strong>
            </Card>
          </div>
          <Card>
            <h2 className="font-semibold text-[#012245]">Colaboradores</h2>
            <div className="mt-4 space-y-3">
              {people.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3 text-sm">
                  <div>
                    <strong>{p.name}</strong>
                    <p className="text-slate-500">
                      {p.role ?? "—"} · {p.team ?? "—"} · R$ {Number(p.salaryBase ?? 0).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <form action={removeClientPerson.bind(null, p.id, id)}>
                    <Button type="submit" variant="secondary">
                      Remover
                    </Button>
                  </form>
                </div>
              ))}
              {!people.length ? <p className="text-sm text-slate-500">Nenhum colaborador cadastrado.</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
