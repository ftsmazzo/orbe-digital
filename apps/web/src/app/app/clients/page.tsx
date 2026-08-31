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
      <PageHeader title="Clientes" description="Funil comercial. No celular, deslize as etapas." />
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <details className="xl:open" open>
            <summary className="cursor-pointer text-lg font-semibold text-[#012245] xl:pointer-events-none xl:list-none">
              Novo cliente
            </summary>
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
          </details>
        </Card>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 xl:mx-0 xl:grid xl:grid-cols-3 xl:overflow-visible xl:px-0 xl:pb-0">
          {rows.length === 0 ? (
            <Card className="min-w-[260px] shrink-0 xl:col-span-3 xl:min-w-0">
              <h2 className="font-semibold text-[#012245]">Nenhum cliente ainda</h2>
              <p className="mt-2 text-sm text-slate-600">
                Use o formulario para criar o primeiro cliente do funil ORBE.
              </p>
            </Card>
          ) : null}
          {byStage.map(({ stage, clients: stageClients }) => (
            <Card key={stage} className="min-h-56 min-w-[260px] shrink-0 snap-start xl:min-w-0">
              <h2 className="font-semibold text-[#012245]">{CRM_STAGE_LABELS[stage]}</h2>
              <p className="text-sm text-slate-500">{stageClients.length} cliente(s)</p>
              <div className="mt-4 space-y-3">
                {stageClients.length === 0 ? (
                  <p className="text-xs text-slate-400">Vazio</p>
                ) : null}
                {stageClients.map((client) => (
                  <div key={client.id} className="rounded-2xl border border-slate-100 p-4">
                    <p className="font-semibold text-[#012245]">{client.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{client.sector ?? "Setor nao informado"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/app/clients/${client.id}/operate`} className="rounded-xl bg-[#012245] px-3 py-1.5 text-xs font-semibold text-white">
                        Operar
                      </Link>
                      <Link href={`/app/clients/${client.id}`} className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[#2e7271]">
                        Gestao
                      </Link>
                    </div>
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
