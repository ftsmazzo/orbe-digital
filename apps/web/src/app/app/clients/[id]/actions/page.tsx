import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ACTION_STATUS_LABELS, ACTION_STATUSES, PERSPECTIVE_LABELS, PERSPECTIVES } from "@orbe/shared";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { actionItems, clients, db, goals, indicators } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";
import { createActionItem, updateActionStatus } from "../../../actions";

export default async function ClientActionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) notFound();
  const [actionRows, goalRows, indicatorRows] = await Promise.all([
    db.select().from(actionItems).where(and(eq(actionItems.clientId, id), eq(actionItems.organizationId, orgId))).orderBy(desc(actionItems.createdAt)),
    db.select().from(goals).where(and(eq(goals.clientId, id), eq(goals.organizationId, orgId))),
    db.select().from(indicators).where(and(eq(indicators.clientId, id), eq(indicators.organizationId, orgId))),
  ]);

  return (
    <>
      <PageHeader title={`Acoes - ${client.name}`} description="Quadro de execucao com responsaveis, prazos e status." />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Nova acao</h2>
          <form action={createActionItem.bind(null, id)} className="mt-4 grid gap-3">
            <Field label="Titulo"><Input name="title" required /></Field>
            <Field label="Como fazer"><Textarea name="how" rows={3} /></Field>
            <Field label="Perspectiva">
              <Select name="perspective">
                <option value="">Sem perspectiva</option>
                {PERSPECTIVES.map((perspective) => <option key={perspective} value={perspective}>{PERSPECTIVE_LABELS[perspective]}</option>)}
              </Select>
            </Field>
            <Field label="Meta"><Select name="goalId"><option value="">Sem meta</option>{goalRows.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</Select></Field>
            <Field label="Indicador"><Select name="indicatorId"><option value="">Sem indicador</option>{indicatorRows.map((indicator) => <option key={indicator.id} value={indicator.id}>{indicator.name}</option>)}</Select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Setor"><Input name="sector" /></Field>
              <Field label="Responsavel"><Input name="ownerName" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Inicio"><Input name="startDate" type="date" /></Field>
              <Field label="Prazo"><Input name="dueDate" type="date" /></Field>
            </div>
            <Field label="Dias uteis"><Input name="businessDays" type="number" /></Field>
            <p className="text-xs text-slate-500">Se informar inicio + dias uteis (sem prazo), o sistema calcula a data fim com feriados BR.</p>
            <Field label="Status"><Select name="status" defaultValue="nao_iniciado">{ACTION_STATUSES.map((status) => <option key={status} value={status}>{ACTION_STATUS_LABELS[status]}</option>)}</Select></Field>
            <Button>Criar acao</Button>
          </form>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ACTION_STATUSES.map((status) => (
            <Card key={status}>
              <h2 className="font-semibold text-[#012245]">{ACTION_STATUS_LABELS[status]}</h2>
              <div className="mt-4 space-y-3">
                {actionRows.filter((action) => action.status === status).map((action) => (
                  <div key={action.id} className="rounded-2xl border border-slate-100 p-4">
                    <strong>{action.title}</strong>
                    <p className="mt-1 text-sm text-slate-500">{action.ownerName ?? "Sem responsavel"} · prazo {formatDate(action.dueDate)}</p>
                    <form action={updateActionStatus.bind(null, action.id, id)} className="mt-3">
                      <Select name="status" defaultValue={action.status} className="w-full text-sm">
                        {ACTION_STATUSES.map((option) => <option key={option} value={option}>{ACTION_STATUS_LABELS[option]}</option>)}
                      </Select>
                      <button className="mt-2 text-xs font-semibold text-[#2e7271]">Mover</button>
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
