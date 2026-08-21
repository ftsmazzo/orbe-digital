import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { clients, db, reports } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";
import { approveReport, generateReport, updateReport } from "../../../actions";

export default async function ReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) notFound();
  const rows = await db.select().from(reports).where(and(eq(reports.clientId, id), eq(reports.organizationId, orgId))).orderBy(desc(reports.createdAt));

  return (
    <>
      <PageHeader
        title={`Relatorios - ${client.name}`}
        description="Gere rascunhos HTML a partir de indicadores e acoes, edite e aprove a versao final."
        action={<form action={generateReport.bind(null, id)}><Button>Gerar relatorio</Button></form>}
      />
      <div className="grid gap-6">
        {rows.map((report) => (
          <Card key={report.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#012245]">{report.title}</h2>
                <p className="text-sm text-slate-500">{formatDateTime(report.createdAt)} · {report.approved ? "Aprovado" : "Rascunho"}</p>
              </div>
              <form action={approveReport.bind(null, report.id, id)}>
                <Button>{report.approved ? "Aprovado" : "Aprovar"}</Button>
              </form>
            </div>
            <form action={updateReport.bind(null, report.id, id)} className="mt-4 grid gap-3">
              <Field label="Titulo"><Input name="title" defaultValue={report.title} /></Field>
              <Field label="HTML do relatorio"><Textarea name="contentHtml" rows={10} defaultValue={report.contentHtml} /></Field>
              <Button variant="secondary">Salvar edicao</Button>
            </form>
            <div className="prose-orbe mt-6 rounded-2xl bg-slate-50 p-5" dangerouslySetInnerHTML={{ __html: report.contentHtml }} />
          </Card>
        ))}
      </div>
    </>
  );
}
