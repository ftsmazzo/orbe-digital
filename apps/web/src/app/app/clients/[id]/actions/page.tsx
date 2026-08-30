import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ACTION_STATUS_LABELS, ACTION_STATUSES, PERSPECTIVE_LABELS, PERSPECTIVES } from "@orbe/shared";
import { ClientWorkspaceNav } from "@/components/ClientWorkspaceNav";
import { Button, Card, CardTitle, EmptyNote, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
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
      <PageHeader
        title={`Acoes · ${client.tradeName ?? client.name}`}
        description="Quadro 5W2H. O ciclo cria as acoes; voce move o status e ajusta prazo."
      />
      <ClientWorkspaceNav clientId={id} current="actions" />

      <Card className="mb-6">
        <CardTitle title="Nova acao" hint="Use se o ciclo nao cobriu um plano que a sessao pediu." />
        <form action={createActionItem.bind(null, id)} className="grid gap-3 md:grid-cols-2">
          <Field label="Titulo"><Input name="title" required /></Field>
          <Field label="Responsavel"><Input name="ownerName" /></Field>
          <div className="md:col-span-2">
            <Field label="Como fazer"><Textarea name="how" rows={3} /></Field>
          </div>
          <Field label="Perspectiva">
            <Select name="perspective">
              <option value="">Sem perspectiva</option>
              {PERSPECTIVES.map((perspective) => (
                <option key={perspective} value={perspective}>{PERSPECTIVE_LABELS[perspective]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Meta">
            <Select name="goalId">
              <option value="">Sem meta</option>
              {goalRows.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
            </Select>
          </Field>
          <Field label="Indicador">
            <Select name="indicatorId">
              <option value="">Sem indicador</option>
              {indicatorRows.map((indicator) => <option key={indicator.id} value={indicator.id}>{indicator.name}</option>)}
            </Select>
          </Field>
          <Field label="Setor"><Input name="sector" /></Field>
          <Field label="Inicio"><Input name="startDate" type="date" /></Field>
          <Field label="Prazo"><Input name="dueDate" type="date" /></Field>
          <Field label="Dias uteis"><Input name="businessDays" type="number" /></Field>
          <Field label="Status">
            <Select name="status" defaultValue="nao_iniciado">
              {ACTION_STATUSES.map((status) => <option key={status} value={status}>{ACTION_STATUS_LABELS[status]}</option>)}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Button>Criar acao</Button>
          </div>
        </form>
      </Card>

      <div className="-mx-6 overflow-x-auto px-6">
        <div className="flex min-w-max gap-4 pb-2">
          {ACTION_STATUSES.map((status) => {
            const rows = actionRows.filter((action) => action.status === status);
            return (
              <Card key={status} className="w-[260px] shrink-0">
                <CardTitle title={ACTION_STATUS_LABELS[status]} hint={`${rows.length} item(ns)`} />
                <div className="space-y-3">
                  {rows.length === 0 ? <EmptyNote>Vazio</EmptyNote> : null}
                  {rows.map((action) => (
                    <div key={action.id} className="rounded-2xl border border-slate-100 p-3">
                      <strong className="break-words text-sm">{action.title}</strong>
                      <p className="mt-1 text-xs text-slate-500">
                        {action.ownerName ?? "Sem responsavel"} · prazo {formatDate(action.dueDate)}
                      </p>
                      <form action={updateActionStatus.bind(null, action.id, id)} className="mt-3">
                        <Select name="status" defaultValue={action.status}>
                          {ACTION_STATUSES.map((option) => (
                            <option key={option} value={option}>{ACTION_STATUS_LABELS[option]}</option>
                          ))}
                        </Select>
                        <button className="mt-2 text-xs font-semibold text-[#2e7271]" type="submit">Mover</button>
                      </form>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
