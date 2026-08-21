import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Button, Card, Field, PageHeader, Textarea } from "@/components/ui";
import { clientPeople, clients, db } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";
import { saveClientTeams } from "../../../actions";

export default async function ClientTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.organizationId, orgId)))
    .limit(1);
  if (!client) notFound();

  const people = await db
    .select()
    .from(clientPeople)
    .where(and(eq(clientPeople.clientId, id), eq(clientPeople.organizationId, orgId)))
    .orderBy(desc(clientPeople.createdAt));

  return (
    <>
      <PageHeader
        title={`Equipes — ${client.name}`}
        description="Areas e responsaveis (Donna equipes/funcionarios). Use na atribuicao de PAs."
      />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Areas da empresa</h2>
          <form action={saveClientTeams.bind(null, id)} className="mt-4 grid gap-3">
            <Field label="Uma area por linha">
              <Textarea name="teams" rows={8} defaultValue={(client.teams ?? []).join("\n")} />
            </Field>
            <Button>Salvar equipes</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-semibold text-[#012245]">Pessoas cadastradas</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cadastro completo de salarios em Folha light.
          </p>
          <div className="mt-4 space-y-2">
            {people.map((p) => (
              <p key={p.id} className="rounded-2xl border border-slate-100 p-3 text-sm">
                <strong>{p.name}</strong> — {p.role ?? "sem cargo"} · {p.team ?? "sem equipe"}
              </p>
            ))}
            {!people.length ? <p className="text-sm text-slate-500">Nenhuma pessoa ainda.</p> : null}
          </div>
        </Card>
      </div>
    </>
  );
}
