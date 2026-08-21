import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { CRM_STAGE_LABELS, CRM_STAGES, type CrmStage } from "@orbe/shared";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { clients, db } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";
import { createClient, updateClientStage } from "../actions";

export default async function ClientsPage() {
  const { orgId } = await getCurrentOrg();
  const rows = await db.select().from(clients).where(eq(clients.organizationId, orgId)).orderBy(desc(clients.updatedAt));
  const byStage = CRM_STAGES.map((stage) => ({ stage, clients: rows.filter((client) => client.stage === stage) }));

  return (
    <>
      <PageHeader title="Clientes" description="Gerencie o CRM consultivo e avance clientes pelo funil ORBE." />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Novo cliente</h2>
          <form action={createClient} className="mt-4 grid gap-3">
            <Field label="Razao social"><Input name="name" required /></Field>
            <Field label="Nome fantasia"><Input name="tradeName" /></Field>
            <Field label="CNPJ"><Input name="cnpj" /></Field>
            <Field label="Setor"><Input name="sector" /></Field>
            <Field label="E-mail"><Input name="email" type="email" /></Field>
            <Field label="Telefone"><Input name="phone" /></Field>
            <Field label="Cidade"><Input name="city" /></Field>
            <Field label="Etapa">
              <Select name="stage" defaultValue="lead">
                {CRM_STAGES.map((stage) => <option key={stage} value={stage}>{CRM_STAGE_LABELS[stage]}</option>)}
              </Select>
            </Field>
            <Field label="Notas"><Textarea name="notes" rows={3} /></Field>
            <Button>Criar cliente</Button>
          </form>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <h2 className="font-semibold text-[#012245]">Nenhum cliente ainda</h2>
              <p className="mt-2 text-sm text-slate-600">
                Use o formulario ao lado para criar o primeiro cliente do funil ORBE (lead → sessao → proposta → ciclo).
              </p>
            </Card>
          ) : null}
          {byStage.map(({ stage, clients: stageClients }) => (
            <Card key={stage} className="min-h-64">
              <h2 className="font-semibold text-[#012245]">{CRM_STAGE_LABELS[stage]}</h2>
              <p className="text-sm text-slate-500">{stageClients.length} cliente(s)</p>
              <div className="mt-4 space-y-3">
                {stageClients.length === 0 ? (
                  <p className="text-xs text-slate-400">Vazio</p>
                ) : null}
                {stageClients.map((client) => (
                  <div key={client.id} className="rounded-2xl border border-slate-100 p-4">
                    <Link href={`/app/clients/${client.id}`} className="font-semibold text-[#012245] hover:underline">{client.name}</Link>
                    <p className="mt-1 text-sm text-slate-500">{client.sector ?? "Setor nao informado"}</p>
                    <form action={updateClientStage.bind(null, client.id)} className="mt-3">
                      <Select name="stage" defaultValue={client.stage} className="w-full text-sm">
                        {CRM_STAGES.map((option) => <option key={option} value={option}>{CRM_STAGE_LABELS[option as CrmStage]}</option>)}
                      </Select>
                      <button className="mt-2 text-xs font-semibold text-[#2e7271]">Atualizar etapa</button>
                    </form>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
