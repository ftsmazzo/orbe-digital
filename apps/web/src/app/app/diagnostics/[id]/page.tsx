import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { clients, db, diagnostics } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";
import { saveDiagnostic, validateDiagnostic } from "../../actions";

export default async function DiagnosticDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [diagnostic] = await db.select().from(diagnostics).where(and(eq(diagnostics.id, id), eq(diagnostics.organizationId, orgId))).limit(1);
  if (!diagnostic) notFound();
  const [client] = await db.select().from(clients).where(eq(clients.id, diagnostic.clientId)).limit(1);

  return (
    <>
      <PageHeader
        title={`Diagnostico ORBE v${diagnostic.version}`}
        description={`${client?.name ?? "Cliente"} · ${diagnostic.validated ? "versao validada" : "rascunho editavel"}`}
        action={client ? <Link href={`/app/clients/${client.id}`} className="rounded-xl border border-[#012245]/15 px-4 py-2 text-sm font-semibold text-[#012245]">Voltar ao cliente</Link> : null}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Campos do diagnostico</h2>
          <form action={saveDiagnostic.bind(null, id)} className="mt-4 grid gap-4">
            <input type="hidden" name="version" value={diagnostic.version} />
            <Field label="Payload JSON">
              <Textarea name="payload" rows={18} defaultValue={JSON.stringify(diagnostic.payload, null, 2)} />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Maturidade (1-5)"><Input name="maturity" type="number" min={1} max={5} defaultValue={diagnostic.maturity ?? ""} /></Field>
            </div>
            <Field label="Gaps (um por linha)"><Textarea name="gaps" rows={4} defaultValue={diagnostic.gaps.join("\n")} /></Field>
            <Field label="Prioridades (uma por linha)"><Textarea name="priorities" rows={4} defaultValue={diagnostic.priorities.join("\n")} /></Field>
            <Field label="Riscos (um por linha)"><Textarea name="risks" rows={4} defaultValue={diagnostic.risks.join("\n")} /></Field>
            <Field label="Perguntas em aberto"><Textarea name="openQuestions" rows={4} defaultValue={diagnostic.openQuestions.join("\n")} /></Field>
            <Button>Salvar rascunho</Button>
          </form>
        </Card>
        <div className="grid gap-6">
          <Card>
            <h2 className="font-semibold text-[#012245]">Validacao</h2>
            <p className="mt-2 text-sm text-slate-500">Ao validar, a versao fica marcada como aprovada para orientar planejamento, relatorios e proposta.</p>
            <form action={validateDiagnostic.bind(null, id)} className="mt-4">
              <Button>{diagnostic.validated ? "Revalidar versao" : "Validar diagnostico"}</Button>
            </form>
          </Card>
          <Card>
            <h2 className="font-semibold text-[#012245]">Resumo</h2>
            <p className="mt-2 text-sm text-slate-600">Gaps: {diagnostic.gaps.length}</p>
            <p className="text-sm text-slate-600">Prioridades: {diagnostic.priorities.length}</p>
            <p className="text-sm text-slate-600">Riscos: {diagnostic.risks.length}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
