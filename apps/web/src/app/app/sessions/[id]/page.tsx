import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { SessionStatusPoller } from "@/components/SessionStatusPoller";
import { Button, Card, Field, PageHeader, Textarea } from "@/components/ui";
import { clients, consultingSessions, db, diagnostics } from "@/lib/db";
import { formatDateTime, SESSION_STATUS_LABEL } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";
import { applySessionTranscript, reextractSessionDiagnostic } from "../../actions";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [session] = await db
    .select()
    .from(consultingSessions)
    .where(and(eq(consultingSessions.id, id), eq(consultingSessions.organizationId, orgId)))
    .limit(1);
  if (!session) notFound();

  const [[client], diagnosticRows] = await Promise.all([
    db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1),
    db
      .select()
      .from(diagnostics)
      .where(and(eq(diagnostics.sessionId, id), eq(diagnostics.organizationId, orgId))),
  ]);

  const statusLabel = SESSION_STATUS_LABEL[session.status] ?? session.status;

  return (
    <>
      <PageHeader
        title={session.title}
        description={`${client?.name ?? "Cliente"} · ${statusLabel} · ${formatDateTime(session.createdAt)}`}
      />
      <div className="mb-4">
        <SessionStatusPoller status={session.status} />
      </div>
      {session.status === "erro" && session.errorMessage ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {session.errorMessage}
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">Transcricao</h2>
            <div className="mt-4 min-h-40 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
              {session.transcriptRaw ??
                (session.status === "processando"
                  ? "Aguardando Whisper… a pagina atualiza sozinha."
                  : "A transcricao ainda nao foi recebida.")}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">
              {session.transcriptRaw ? "Atualizar / reextrair" : "Colar transcricao"}
            </h2>
            <form action={applySessionTranscript.bind(null, session.id)} className="mt-4 grid gap-3">
              <Field label="Texto da conversa">
                <Textarea
                  name="transcript"
                  rows={10}
                  defaultValue={session.transcriptRaw ?? ""}
                  placeholder="Cole a conversa completa aqui..."
                  required
                />
              </Field>
              <Button>{session.transcriptRaw ? "Reprocessar diagnostico" : "Salvar e extrair diagnostico"}</Button>
            </form>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card>
            <h2 className="font-semibold text-[#012245]">Consentimento</h2>
            <p className="mt-2 text-sm text-slate-600">
              {session.consentGiven ? `Autorizado em ${formatDateTime(session.consentAt)}` : "Nao registrado"}
            </p>
          </Card>
          <Card>
            <h2 className="font-semibold text-[#012245]">Audio</h2>
            <p className="mt-2 break-all text-sm text-slate-600">{session.audioUrl ?? "Nenhum arquivo enviado."}</p>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">Diagnostico gerado</h2>
            {session.transcriptRaw ? (
              <form action={reextractSessionDiagnostic.bind(null, session.id)} className="mt-3">
                <Button type="submit">Reextrair com Claude</Button>
              </form>
            ) : null}
            {diagnosticRows.length ? (
              diagnosticRows.map((diagnostic) => (
                <Link
                  key={diagnostic.id}
                  href={`/app/diagnostics/${diagnostic.id}`}
                  className="mt-3 block rounded-2xl border border-slate-100 p-3 text-sm text-[#2e7271]"
                >
                  Abrir diagnostico v{diagnostic.version}
                  {diagnostic.validated ? " (validado)" : " (rascunho)"}
                </Link>
              ))
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Apos a transcricao, o diagnostico Claude aparece aqui automaticamente.
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
