import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { clientFinancials, clients, db } from "@/lib/db";
import { computeFeeSchedule } from "@/lib/finance/ebitda";
import { getCurrentOrg } from "@/lib/org";
import { saveMonthlyEbitda } from "../../../../actions";
import type { SalesQualification } from "@orbe/shared";

export default async function EbitdaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) notFound();
  const rows = await db
    .select()
    .from(clientFinancials)
    .where(and(eq(clientFinancials.clientId, id), eq(clientFinancials.organizationId, orgId)))
    .orderBy(desc(clientFinancials.year), desc(clientFinancials.month));

  const qual = (client.salesQualification ?? {}) as SalesQualification;
  const modality = qual.billingStart === "m1" ? "m1" : "m6";
  const schedule = computeFeeSchedule({
    modality,
    months: rows.map((r) => ({ year: r.year, month: r.month, ebitda: Number(r.ebitda) })),
    contractStart: new Date(),
  });

  const now = new Date();
  const day = now.getDate();
  const alertDay10 = day >= 8 && day <= 12;

  return (
    <>
      <PageHeader
        title={`Honorarios EBITDA — ${client.name}`}
        description="15% sobre EBITDA. Modalidade M1 ou carencia M6. Vencimento padrao dia 10."
      />
      {alertDay10 ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Janela do dia 10: conferir cobranca / carencia. Mora: multa 2% + juros 1% a.m. + IPCA.
          Inadimplencia 30 dias: suspensao. 60 dias: rescisao (aviso 60 dias; multa rescisoria 10% da media mensal de EBITDA).
        </p>
      ) : (
        <p className="mb-4 text-xs text-slate-500">
          Vencimento padrao dia 10. Politica de mora 30/60 dias conforme contrato Soluciona.
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="font-semibold text-[#012245]">Lancamento mensal</h2>
          <form action={saveMonthlyEbitda.bind(null, id)} className="mt-4 grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Ano"><Input name="year" type="number" defaultValue={new Date().getFullYear()} /></Field>
              <Field label="Mes"><Input name="month" type="number" min={1} max={12} defaultValue={new Date().getMonth() + 1} /></Field>
            </div>
            <Field label="Receita liquida"><Input name="revenueNet" type="number" step="0.01" required /></Field>
            <Field label="CPV/CSV"><Input name="cpv" type="number" step="0.01" defaultValue="0" /></Field>
            <Field label="Despesas operacionais"><Input name="opex" type="number" step="0.01" defaultValue="0" /></Field>
            <Field label="Depreciacao"><Input name="depreciation" type="number" step="0.01" defaultValue="0" /></Field>
            <Field label="Amortizacao"><Input name="amortization" type="number" step="0.01" defaultValue="0" /></Field>
            <Button>Salvar DRE / EBITDA</Button>
          </form>
        </Card>
        <div className="grid gap-6">
          <Card>
            <h2 className="font-semibold text-[#012245]">Calculadora (modalidade {modality})</h2>
            <p className="mt-2 text-sm">1o pagamento: R$ {schedule.firstPayment.toLocaleString("pt-BR")}</p>
            <p className="text-sm">Mensal seguinte: R$ {schedule.subsequentMonthly.toLocaleString("pt-BR")}</p>
            <p className="mt-2 text-xs text-slate-500">{schedule.annualTrueUpHint}</p>
            <ul className="mt-3 list-disc pl-5 text-sm">
              {schedule.items.map((item) => (
                <li key={item.label}>
                  {item.label}: R$ {item.amount.toLocaleString("pt-BR")} — {item.note}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="font-semibold text-[#012245]">Historico</h2>
            <div className="mt-3 space-y-2 text-sm">
              {rows.map((r) => (
                <p key={r.id}>
                  {String(r.month).padStart(2, "0")}/{r.year} — EBITDA R$ {Number(r.ebitda).toLocaleString("pt-BR")}
                </p>
              ))}
              {!rows.length ? <p className="text-slate-500">Nenhum lancamento.</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
