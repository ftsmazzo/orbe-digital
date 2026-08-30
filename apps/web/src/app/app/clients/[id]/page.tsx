import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { CRM_STAGE_LABELS, CRM_STAGES, type SalesQualification } from "@orbe/shared";
import { SalesQualificationForm } from "@/components/SalesQualificationForm";
import { Button, Card, Field, Input, LinkButton, PageHeader, Select, Textarea } from "@/components/ui";
import { actionItems, clients, consultingSessions, db, diagnostics, organizations, proposals, reports, salesScoreEvents } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { mergeOrgSettings } from "@/lib/sales/playbook";
import { getCurrentOrg } from "@/lib/org";
import { saveSalesQualification, updateClient } from "../../actions";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) notFound();

  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const settings = mergeOrgSettings(org?.settings);

  const [sessionRows, diagnosticRows, actionRows, reportRows, proposalRows] = await Promise.all([
    db.select().from(consultingSessions).where(and(eq(consultingSessions.clientId, id), eq(consultingSessions.organizationId, orgId))).orderBy(desc(consultingSessions.createdAt)),
    db.select().from(diagnostics).where(and(eq(diagnostics.clientId, id), eq(diagnostics.organizationId, orgId))).orderBy(desc(diagnostics.createdAt)),
    db.select().from(actionItems).where(and(eq(actionItems.clientId, id), eq(actionItems.organizationId, orgId))).orderBy(desc(actionItems.createdAt)),
    db.select().from(reports).where(and(eq(reports.clientId, id), eq(reports.organizationId, orgId))).orderBy(desc(reports.createdAt)),
    db.select().from(proposals).where(and(eq(proposals.clientId, id), eq(proposals.organizationId, orgId))).orderBy(desc(proposals.createdAt)),
  ]);
  const scoreEventRows = await db
    .select()
    .from(salesScoreEvents)
    .where(eq(salesScoreEvents.organizationId, orgId))
    .orderBy(desc(salesScoreEvents.createdAt))
    .limit(40);

  return (
    <>
      <PageHeader
        title={client.name}
        description={`${CRM_STAGE_LABELS[client.stage]} · ${client.sector ?? "Setor nao informado"}`}
        action={<LinkButton href={`/app/clients/${id}/operate`}>Abrir operacao</LinkButton>}
      />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="grid gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">Cadastro</h2>
            <form action={updateClient.bind(null, id)} className="mt-4 grid gap-3">
              <Field label="Razao social"><Input name="name" defaultValue={client.name} required /></Field>
              <Field label="Nome fantasia"><Input name="tradeName" defaultValue={client.tradeName ?? ""} /></Field>
              <Field label="CNPJ"><Input name="cnpj" defaultValue={client.cnpj ?? ""} /></Field>
              <Field label="Setor"><Input name="sector" defaultValue={client.sector ?? ""} /></Field>
              <Field label="E-mail"><Input name="email" defaultValue={client.email ?? ""} type="email" /></Field>
              <Field label="Telefone"><Input name="phone" defaultValue={client.phone ?? ""} /></Field>
              <Field label="Cidade"><Input name="city" defaultValue={client.city ?? ""} /></Field>
              <Field label="Etapa">
                <Select name="stage" defaultValue={client.stage}>
                  {CRM_STAGES.map((stage) => <option key={stage} value={stage}>{CRM_STAGE_LABELS[stage]}</option>)}
                </Select>
              </Field>
              <Field label="Notas"><Textarea name="notes" rows={4} defaultValue={client.notes ?? ""} /></Field>
              <Button>Salvar cadastro</Button>
            </form>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">Qualificacao comercial</h2>
            <p className="mt-1 text-sm text-slate-500">Playbook + filtro admitir (pre-ciclo).</p>
            <div className="mt-4">
              <SalesQualificationForm
                action={saveSalesQualification.bind(null, id)}
                initial={(client.salesQualification ?? {}) as SalesQualification}
                priceBook={settings.priceBook}
                learnedEvents={scoreEventRows.map((e) => ({
                  verdict: e.verdict,
                  payload: (e.payload ?? {}) as Record<string, unknown>,
                }))}
              />
            </div>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">Atalhos do ciclo</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <LinkButton href={`/app/clients/${id}/operate`}>Operar esta empresa</LinkButton>
              <LinkButton href={`/app/clients/${id}/actions`}>Acoes</LinkButton>
              <LinkButton href={`/app/clients/${id}/dashboard`}>Dashboard</LinkButton>
              <LinkButton href={`/print/dashboard/${id}`}>Imprimir dashboard</LinkButton>
              <LinkButton href={`/app/clients/${id}/reports`}>Relatorios</LinkButton>
              <LinkButton href={`/app/clients/${id}/proposals`}>Propostas</LinkButton>
              <LinkButton href={`/app/clients/${id}/team`}>Equipes</LinkButton>
              <LinkButton href={`/app/clients/${id}/finance/working-capital`}>Capital de giro</LinkButton>
              <LinkButton href={`/app/clients/${id}/finance/valuation`}>Valuation</LinkButton>
              <LinkButton href={`/app/clients/${id}/finance/payroll`}>Folha light</LinkButton>
              <LinkButton href={`/app/clients/${id}/finance/ebitda`}>Honorarios EBITDA</LinkButton>
              <LinkButton href={`/app/clients/${id}/contracts`}>Contrato</LinkButton>
            </div>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="font-semibold text-[#012245]">Sessoes</h2>
              {sessionRows.map((session) => (
                <Link key={session.id} href={`/app/sessions/${session.id}`} className="mt-3 block rounded-2xl border border-slate-100 p-3 text-sm hover:bg-slate-50">
                  <strong>{session.title}</strong>
                  <span className="block text-slate-500">{session.status} · {formatDateTime(session.createdAt)}</span>
                </Link>
              ))}
            </Card>
            <Card>
              <h2 className="font-semibold text-[#012245]">Diagnosticos</h2>
              {diagnosticRows.map((diagnostic) => (
                <Link key={diagnostic.id} href={`/app/diagnostics/${diagnostic.id}`} className="mt-3 block rounded-2xl border border-slate-100 p-3 text-sm hover:bg-slate-50">
                  <strong>Versao {diagnostic.version}</strong>
                  <span className="block text-slate-500">{diagnostic.validated ? "Validado" : "Rascunho"} · maturidade {diagnostic.maturity ?? "-"}</span>
                </Link>
              ))}
            </Card>
            <Card>
              <h2 className="font-semibold text-[#012245]">Acoes recentes</h2>
              {actionRows.slice(0, 5).map((action) => <p key={action.id} className="mt-3 rounded-2xl border border-slate-100 p-3 text-sm">{action.title}</p>)}
            </Card>
            <Card>
              <h2 className="font-semibold text-[#012245]">Documentos</h2>
              <p className="mt-3 text-sm text-slate-500">{reportRows.length} relatorio(s) e {proposalRows.length} proposta(s) gerados.</p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
