import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Card, PageHeader } from "@/components/ui";
import { SessionCreateForm } from "@/components/SessionCreateForm";
import { clients, consultingSessions, db } from "@/lib/db";
import { formatDateTime, SESSION_STATUS_LABEL } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";

export default async function SessionsPage() {
  const { orgId } = await getCurrentOrg();
  const [clientRows, sessionRows] = await Promise.all([
    db.select().from(clients).where(eq(clients.organizationId, orgId)).orderBy(desc(clients.updatedAt)),
    db
      .select({
        id: consultingSessions.id,
        title: consultingSessions.title,
        status: consultingSessions.status,
        errorMessage: consultingSessions.errorMessage,
        createdAt: consultingSessions.createdAt,
        clientId: consultingSessions.clientId,
        clientName: clients.name,
        tradeName: clients.tradeName,
      })
      .from(consultingSessions)
      .leftJoin(clients, eq(clients.id, consultingSessions.clientId))
      .where(eq(consultingSessions.organizationId, orgId))
      .orderBy(desc(consultingSessions.createdAt)),
  ]);

  return (
    <>
      <PageHeader
        title="Sessoes"
        description="Historico por empresa. No dia a dia, grave em Operacao dentro do cliente."
      />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Nova sessao</h2>
          {clientRows.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              Crie um cliente no CRM antes de abrir uma sessao.{" "}
              <Link href="/app/clients" className="font-semibold text-[#2e7271] hover:underline">
                Ir para Clientes
              </Link>
            </p>
          ) : (
            <SessionCreateForm clients={clientRows.map((c) => ({ id: c.id, name: c.name }))} />
          )}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Historico</h2>
          <div className="mt-4 grid gap-3">
            {sessionRows.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma sessao ainda. Use o gravador ao lado para iniciar o primeiro registro.
              </p>
            ) : (
              sessionRows.map((session) => (
                <Link
                  key={session.id}
                  href={`/app/sessions/${session.id}`}
                  className="rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-[#012245]">{session.tradeName ?? session.clientName ?? "Empresa"} · {session.title}</strong>
                    <span className="rounded-full bg-[#2e7271]/10 px-3 py-1 text-xs font-semibold text-[#2e7271]">
                      {SESSION_STATUS_LABEL[session.status] ?? session.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{formatDateTime(session.createdAt)}</p>
                  {session.status === "erro" && session.errorMessage ? (
                    <p className="mt-1 line-clamp-2 text-xs text-red-700">{session.errorMessage}</p>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
