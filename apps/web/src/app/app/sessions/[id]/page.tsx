import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import type { SalesQualification } from "@orbe/shared";
import { ClientFitBanner } from "@/components/ClientFitBanner";
import { MemoryMarkdown } from "@/components/MemoryMarkdown";
import { SessionAudioRescue } from "@/components/SessionAudioRescue";
import { SessionStatusPoller } from "@/components/SessionStatusPoller";
import { Button, Card, Field, LinkButton, PageHeader, Textarea } from "@/components/ui";
import { formatSessionMarkdown } from "@/lib/sessions/format-transcript";
import { parseSttProgress, toPublicSttProgress } from "@/lib/sessions/stt-progress";
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
  const sttProgress = toPublicSttProgress(parseSttProgress(session.transcriptSegments));

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
        <SessionStatusPoller
          status={session.status}
          since={session.updatedAt ?? session.createdAt}
          progress={sttProgress}
        />
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
            <h2 className="text-lg font-semibold text-[#012245]">Esta conversa</h2>
            <p className="mt-1 text-sm text-slate-500">
              Entra no dossie (mais novo em cima). O motor le o dossie, nao esta sessao isolada.
            </p>
            <div className="mt-4 min-h-40 rounded-2xl bg-slate-50 p-5">
              {hasTranscript ? (
                <MemoryMarkdown markdown={formatSessionMarkdown(session.transcriptRaw ?? "")} />
              ) : session.status === "processando" ? (
                <p className="text-sm text-slate-500">
                  {sttProgress?.chunked
                    ? "Audio longo: transcrevendo em partes e montando o texto completo."
                    : "Aguardando a transcricao… o status acima mostra o progresso."}
                </p>
              ) : (
                <p className="text-sm text-slate-500">A transcricao ainda nao foi recebida.</p>
              )}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">
              {hasTranscript ? "Corrigir transcricao" : "Colar transcricao"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ao salvar, o texto e formatado e sobe para o topo do dossie. Diagnostico e ciclo saem so do cockpit.
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
              <div className="mt-4 grid gap-2">
                <LinkButton href={`/app/clients/${client.id}/memory`}>Abrir dossie</LinkButton>
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
          <SessionAudioRescue
            sessionId={session.id}
            hasAudio={Boolean(session.audioKey)}
            status={session.status}
          />
        </div>
      </div>
    </>
  );
}
