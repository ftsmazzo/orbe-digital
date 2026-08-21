import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { clients, consultingSessions, db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";
import { createSession } from "../actions";

export default async function SessionsPage() {
  const { orgId } = await getCurrentOrg();
  const [clientRows, sessionRows] = await Promise.all([
    db.select().from(clients).where(eq(clients.organizationId, orgId)).orderBy(desc(clients.updatedAt)),
    db.select().from(consultingSessions).where(eq(consultingSessions.organizationId, orgId)).orderBy(desc(consultingSessions.createdAt)),
  ]);

  return (
    <>
      <PageHeader title="Sessoes" description="Registre consentimento, envie audio e acompanhe a transcricao da sessao consultiva." />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Nova sessao</h2>
          <form action={createSession} className="mt-4 grid gap-3">
            <Field label="Cliente">
              <Select name="clientId" required>
                <option value="">Selecione</option>
                {clientRows.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </Select>
            </Field>
            <Field label="Titulo"><Input name="title" placeholder="Sessao de diagnostico ORBE" /></Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input name="consentGiven" type="checkbox" required />
              Consentimento de gravacao autorizado pelo cliente.
            </label>
            <Field label="Audio da sessao">
              <Input name="audio" type="file" accept="audio/*,video/*" />
            </Field>
            <p className="text-xs text-slate-500">Sem n8n configurado, o app usa transcricao e extracao mock para criar um diagnostico rascunho.</p>
            <Button>Criar e processar</Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Historico</h2>
          <div className="mt-4 grid gap-3">
            {sessionRows.map((session) => (
              <Link key={session.id} href={`/app/sessions/${session.id}`} className="rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-[#012245]">{session.title}</strong>
                  <span className="rounded-full bg-[#2e7271]/10 px-3 py-1 text-xs font-semibold text-[#2e7271]">{session.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{formatDateTime(session.createdAt)}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
