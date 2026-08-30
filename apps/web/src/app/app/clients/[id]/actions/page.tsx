import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ACTION_STATUS_LABELS, ACTION_STATUSES, PERSPECTIVE_LABELS_DANIEL, PERSPECTIVES, type ActionStatus } from "@orbe/shared";
import { ActionWorkboard } from "@/components/ActionWorkboard";
import { ClientWorkspaceNav } from "@/components/ClientWorkspaceNav";
import { Button, Card, CardTitle, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { actionItems, clients, db, goals, indicators } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";
import { createActionItem } from "../../../actions";

export default async function ClientActionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ vista?: string }>;
}) {
  const { id } = await params;
  const { vista } = await searchParams;
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
        description="O ciclo sugere inicio, dias uteis e prazo. Voce ajusta e move o status."
      />
      <ClientWorkspaceNav clientId={id} current="actions" />

      <ActionWorkboard
        clientId={id}
        vista={vista === "quadro" ? "quadro" : "lista"}
        actions={actionRows.map((action) => ({
          id: action.id,
          title: action.title,
          how: action.how,
          ownerName: action.ownerName,
          startDate: action.startDate,
          dueDate: action.dueDate,
          businessDays: action.businessDays,
          status: action.status as ActionStatus,
          perspective: action.perspective,
          sector: action.sector,
        }))}
      />

      <Card className="mt-6">
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
                <option key={perspective} value={perspective}>{PERSPECTIVE_LABELS_DANIEL[perspective]}</option>
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
    </>
  );
}
