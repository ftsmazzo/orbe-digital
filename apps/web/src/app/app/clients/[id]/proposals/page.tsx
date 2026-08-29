import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { clients, db, proposals } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";
import { generateProposal, updateProposal } from "../../../actions";

export default async function ProposalsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) notFound();
  const rows = await db.select().from(proposals).where(and(eq(proposals.clientId, id), eq(proposals.organizationId, orgId))).orderBy(desc(proposals.createdAt));

  return (
    <>
      <PageHeader
        title={`Propostas - ${client.name}`}
        description="Gere proposta comercial ORBE a partir do cliente e diagnostico mais recente."
        action={<form action={generateProposal.bind(null, id)}><Button>Gerar proposta</Button></form>}
      />
      <div className="grid gap-6">
        {rows.map((proposal) => (
          <Card key={proposal.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#012245]">{proposal.title}</h2>
                <p className="text-sm text-slate-500">{formatDateTime(proposal.createdAt)} · {proposal.status}</p>
              </div>
              <a
                href={`/print/proposal/${proposal.id}`}
                className="rounded-xl border border-[#012245]/15 px-4 py-2 text-sm font-semibold text-[#012245]"
              >
                Imprimir PDF
              </a>
            </div>
            <form action={updateProposal.bind(null, proposal.id, id)} className="mt-4 grid gap-3">
              <Field label="Titulo"><Input name="title" defaultValue={proposal.title} /></Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Investimento"><Input name="investment" type="number" step="0.01" defaultValue={proposal.investment ?? ""} /></Field>
                <Field label="Status">
                  <Select name="status" defaultValue={proposal.status}>
                    <option value="rascunho">Rascunho</option>
                    <option value="enviada">Enviada</option>
                    <option value="aprovada">Aprovada</option>
                    <option value="recusada">Recusada</option>
                  </Select>
                </Field>
              </div>
              <Field label="HTML da proposta"><Textarea name="contentHtml" rows={12} defaultValue={proposal.contentHtml} /></Field>
              <Button variant="secondary">Salvar proposta</Button>
            </form>
            <div className="prose-orbe mt-6 rounded-2xl bg-slate-50 p-5" dangerouslySetInnerHTML={{ __html: proposal.contentHtml }} />
          </Card>
        ))}
      </div>
    </>
  );
}
