import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { Card, PageHeader } from "@/components/ui";
import { clients, consultingSessions, db, diagnostics } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [session] = await db.select().from(consultingSessions).where(and(eq(consultingSessions.id, id), eq(consultingSessions.organizationId, orgId))).limit(1);
  if (!session) notFound();

  const [[client], diagnosticRows] = await Promise.all([
    db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1),
    db.select().from(diagnostics).where(and(eq(diagnostics.sessionId, id), eq(diagnostics.organizationId, orgId))),
  ]);

  return (
    <>
      <PageHeader title={session.title} description={`${client?.name ?? "Cliente"} · ${session.status} · ${formatDateTime(session.createdAt)}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Transcricao</h2>
          <div className="mt-4 min-h-64 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            {session.transcriptRaw ?? "A transcricao ainda nao foi recebida."}
          </div>
        </Card>
        <div className="grid gap-6">
          <Card>
            <h2 className="font-semibold text-[#012245]">Consentimento</h2>
            <p className="mt-2 text-sm text-slate-600">{session.consentGiven ? `Autorizado em ${formatDateTime(session.consentAt)}` : "Nao registrado"}</p>
          </Card>
          <Card>
            <h2 className="font-semibold text-[#012245]">Audio</h2>
            <p className="mt-2 break-all text-sm text-slate-600">{session.audioUrl ?? "Nenhum arquivo enviado."}</p>
          </Card>
          <Card>
            <h2 className="font-semibold text-[#012245]">Diagnostico gerado</h2>
            {diagnosticRows.length ? (
              diagnosticRows.map((diagnostic) => (
                <Link key={diagnostic.id} href={`/app/diagnostics/${diagnostic.id}`} className="mt-3 block rounded-2xl border border-slate-100 p-3 text-sm text-[#2e7271]">
                  Abrir diagnostico v{diagnostic.version}
                </Link>
              ))
            ) : (
              <p className="mt-2 text-sm text-slate-500">Nenhum diagnostico criado ainda.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
