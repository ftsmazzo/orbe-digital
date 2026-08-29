import { eq } from "drizzle-orm";
import { PRINCIPLE_CARDS } from "@/lib/knowledge/canon";
import { Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { db, knowledgeSources } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";
import { addKnowledgeNote } from "../../actions";

export default async function KnowledgePage() {
  const { orgId } = await getCurrentOrg();
  const uploads = await db.select().from(knowledgeSources).where(eq(knowledgeSources.organizationId, orgId));

  return (
    <>
      <PageHeader
        title="Base de conhecimento"
        description="Fichas Hill / Kaplan ja entram nas analises. Cole trechos de PDFs que voce possui (nao piratear livros)."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <h2 className="font-semibold text-[#012245]">Canone (fichas)</h2>
          <div className="mt-4 grid gap-3">
            {PRINCIPLE_CARDS.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-100 p-3 text-sm">
                <strong>
                  {c.title} — {c.author}
                </strong>
                <p className="mt-1 text-slate-600">{c.thesis}</p>
                <p className="text-xs text-slate-500">Peso {c.weight} · {c.area}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold text-[#012245]">Adicionar trecho (PDF que voce possui)</h2>
          <form action={addKnowledgeNote} className="mt-4 grid gap-3">
            <Field label="Titulo / livro"><Input name="title" required /></Field>
            <Field label="Autor"><Input name="author" /></Field>
            <Field label="Peso (Hill=3, Kaplan=2, demais=1)"><Input name="weight" type="number" defaultValue="1" /></Field>
            <Field label="Trecho"><Textarea name="content" rows={8} required /></Field>
            <Button>Salvar trecho</Button>
          </form>
          <div className="mt-4 text-sm">
            {uploads.map((u) => (
              <p key={u.id}>{u.title}</p>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
