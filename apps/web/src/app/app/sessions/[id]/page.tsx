import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import type { SalesQualification } from "@orbe/shared";
import { ClientFitBanner } from "@/components/ClientFitBanner";
import { SessionStatusPoller } from "@/components/SessionStatusPoller";
import { Button, Card, Field, LinkButton, PageHeader, Textarea } from "@/components/ui";
import { clients, consultingSessions, db } from "@/lib/db";
import { formatDateTime, SESSION_STATUS_LABEL } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";
import { applySessionTranscript } from "../../actions";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [session] = await db
    .select()
    .from(consultingSessions)
    .where(and(eq(consultingSessions.id, id), eq(consultingSessions.organizationId, orgId)))
    .limit(1);
  if (!session) notFound();

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, session.clientId), eq(clients.organizationId, orgId)))
    .limit(1);

  const statusLabel = SESSION_STATUS_LABEL[session.status] ?? session.status;
  const hasTranscript = Boolean(session.transcriptRaw?.trim());
  const isEstrategica = session.kind === "estrategica";

  return (
    <>
      <PageHeader
        title={session.title}
        description={`${client?.name ?? "Cliente"} · ${statusLabel} · ${formatDateTime(session.createdAt)}`}
        action={
          client ? (
            <LinkButton href={`/app/clients/${client.id}/operate`}>Voltar a operar</LinkButton>
          ) : undefined
        }
      />
      <div className="mb-4">
        <SessionStatusPoller status={session.status} />
      </div>
      {session.status === "erro" && session.errorMessage ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {session.errorMessage}
        </p>
      ) : null}

      {client ? (
        <ClientFitBanner
          clientId={client.id}
          sessionId={session.id}
          qualification={(client.salesQualification ?? {}) as SalesQualification}
          hasTranscript={hasTranscript}
        />
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
              {hasTranscript ? "Corrigir transcricao" : "Colar transcricao"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Salva o texto e, se for reuniao estrategica, le o fit. Diagnostico e ciclo saem so do cockpit.
            </p>
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
              <Button>{isEstrategica ? "Salvar e ler o fit" : "Salvar transcricao"}</Button>
            </form>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card>
            <h2 className="font-semibold text-[#012245]">Proximo passo</h2>
            <p className="mt-2 text-sm text-slate-600">
              A sessao guarda a conversa. O cockpit processa o ciclo ORBE com o historico inteiro — nao ha
              diagnostico solto aqui.
            </p>
            {client ? (
              <div className="mt-4">
                <LinkButton href={`/app/clients/${client.id}/operate`}>Abrir cockpit desta empresa</LinkButton>
              </div>
            ) : null}
          </Card>
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
        </div>
      </div>
    </>
  );
}
