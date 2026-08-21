import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { PERSPECTIVE_LABELS, PERSPECTIVES } from "@orbe/shared";
import { MarketResearchForm } from "@/components/MarketResearchForm";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { clients, db, goals, indicators, marketInsights } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";
import { createGoal, createIndicator } from "../../../actions";

export const maxDuration = 180;

const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));

export default async function PlanningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.organizationId, orgId)))
    .limit(1);
  if (!client) notFound();

  const [goalRows, indicatorRows, insightRows] = await Promise.all([
    db.select().from(goals).where(and(eq(goals.clientId, id), eq(goals.organizationId, orgId))).orderBy(desc(goals.createdAt)),
    db
      .select()
      .from(indicators)
      .where(and(eq(indicators.clientId, id), eq(indicators.organizationId, orgId)))
      .orderBy(desc(indicators.createdAt)),
    db
      .select()
      .from(marketInsights)
      .where(and(eq(marketInsights.clientId, id), eq(marketInsights.organizationId, orgId)))
      .orderBy(desc(marketInsights.createdAt)),
  ]);

  return (
    <>
      <PageHeader
        title={`Planejamento - ${client.name}`}
        description="Fase R (Resultar): pesquisa de mercado regional/global, metas e indicadores nas 4 perspectivas."
      />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="grid gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">Pesquisa de mercado (R)</h2>
            <p className="mt-1 text-sm text-slate-500">
              Regional para empresa local; global/amplo quando o alcance for maior. Gera rascunho para personalizar o comercial.
            </p>
            <MarketResearchForm
              clientId={id}
              defaultRegion={client.city ?? ""}
              defaultSector={client.sector ?? ""}
            />
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">Nova meta</h2>
            <form action={createGoal.bind(null, id)} className="mt-4 grid gap-3">
              <Field label="Titulo">
                <Input name="title" required />
              </Field>
              <Field label="Ano">
                <Input name="year" type="number" defaultValue={new Date().getFullYear()} />
              </Field>
              <Field label="Notas">
                <Textarea name="notes" rows={3} />
              </Field>
              <Button>Criar meta</Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">Novo indicador</h2>
            <form action={createIndicator.bind(null, id)} className="mt-4 grid gap-3">
              <Field label="Meta">
                <Select name="goalId">
                  <option value="">Sem meta vinculada</option>
                  {goalRows.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Perspectiva">
                <Select name="perspective" required>
                  {PERSPECTIVES.map((perspective) => (
                    <option key={perspective} value={perspective}>
                      {PERSPECTIVE_LABELS[perspective]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Nome">
                <Input name="name" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Direcao">
                  <Select name="direction" defaultValue="aumentar">
                    <option value="aumentar">Aumentar</option>
                    <option value="reduzir">Reduzir</option>
                  </Select>
                </Field>
                <Field label="Unidade">
                  <Input name="unit" defaultValue="numero" />
                </Field>
              </div>
              <Field label="Ano">
                <Input name="year" type="number" defaultValue={new Date().getFullYear()} />
              </Field>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Mensal planejado / realizado</p>
                <div className="grid grid-cols-3 gap-2">
                  {months.map((month) => (
                    <div key={month} className="grid gap-1 rounded-xl bg-slate-50 p-2 text-xs">
                      <span className="font-semibold">M{month}</span>
                      <Input name={`planned_${month}`} type="number" step="0.01" placeholder="Plan." />
                      <Input name={`actual_${month}`} type="number" step="0.01" placeholder="Real." />
                    </div>
                  ))}
                </div>
              </div>
              <Button>Criar indicador</Button>
            </form>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">Insights de mercado</h2>
            <div className="mt-4 grid gap-4">
              {insightRows.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma pesquisa ainda. Rode a pesquisa regional ou global ao lado.</p>
              ) : (
                insightRows.map((insight) => {
                  const payload = insight.payload as {
                    contexto_mercado?: string[];
                    oportunidades?: string[];
                    personalizacao_comercial?: string[];
                    fontes_orientacao?: string[];
                    indicadores_sugeridos?: { nome: string; perspectiva: string; referencia: string }[];
                  };
                  return (
                    <div key={insight.id} className="rounded-2xl border border-slate-100 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-[#012245]">{insight.scope === "regional" ? "Regional" : "Global / amplo"}</strong>
                        <span className="text-xs text-slate-500">{formatDateTime(insight.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{insight.summary}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#2e7271]">
                        {insight.sector} · {insight.region}
                      </p>
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {(payload.contexto_mercado ?? []).slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      {(payload.fontes_orientacao ?? []).length ? (
                        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                          <p className="font-semibold text-[#012245]">Fontes</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4">
                            {payload.fontes_orientacao!.slice(0, 8).map((item) => (
                              <li key={item} className="break-all">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {(payload.personalizacao_comercial ?? []).length ? (
                        <div className="mt-3 rounded-xl bg-[#f7f4ee] p-3 text-sm text-slate-700">
                          <p className="font-semibold text-[#012245]">Comercial personalizado</p>
                          <ul className="mt-1 list-disc space-y-1 pl-5">
                            {payload.personalizacao_comercial!.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">Metas</h2>
            <div className="mt-4 grid gap-3">
              {goalRows.map((goal) => (
                <div key={goal.id} className="rounded-2xl border border-slate-100 p-4">
                  <strong>{goal.title}</strong>
                  <p className="text-sm text-slate-500">
                    {goal.year} · {goal.notes ?? "Sem notas"}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-[#012245]">Indicadores</h2>
            <div className="mt-4 grid gap-4">
              {indicatorRows.map((indicator) => (
                <div key={indicator.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <strong>{indicator.name}</strong>
                    <span className="text-sm font-semibold text-[#2e7271]">{PERSPECTIVE_LABELS[indicator.perspective]}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {indicator.direction} · {indicator.unit} · {indicator.year}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
