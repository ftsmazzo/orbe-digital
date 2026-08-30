import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { PERSPECTIVE_LABELS_DANIEL, PERSPECTIVES } from "@orbe/shared";
import { ClientWorkspaceNav } from "@/components/ClientWorkspaceNav";
import { KpiResultTrack } from "@/components/KpiResultTrack";
import { MarketResearchForm } from "@/components/MarketResearchForm";
import { Button, Card, CardTitle, EmptyNote, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { currentMonthLabel } from "@/lib/actions/pulse";
import { clients, db, goals, indicators, marketInsights } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getCurrentOrg } from "@/lib/org";
import { createGoal, createIndicator } from "../../../actions";

export const maxDuration = 180;

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
        title={`Planejamento · ${client.tradeName ?? client.name}`}
        description={`Informe o realizado de ${currentMonthLabel()}. O ORBE so preenche planejado com DRE ou numero na sessao.`}
      />
      <ClientWorkspaceNav clientId={id} current="planning" />

      <Card>
        <CardTitle kicker="Este mes" title={currentMonthLabel()} hint="Um KPI por linha. O ano fica escondido ate voce pedir." />
        {indicatorRows.length === 0 ? (
          <EmptyNote>Sem KPI ainda. Processe o ciclo na Operacao.</EmptyNote>
        ) : (
          <div className="grid gap-5">
            {PERSPECTIVES.map((perspective) => {
              const items = indicatorRows.filter((row) => row.perspective === perspective);
              if (!items.length) return null;
              return (
                <section key={perspective} className="grid gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">
                    {PERSPECTIVE_LABELS_DANIEL[perspective]}
                  </p>
                  {items.map((indicator) => (
                    <KpiResultTrack
                      key={`${indicator.id}-${JSON.stringify(indicator.planned)}`}
                      clientId={id}
                      indicator={{
                        id: indicator.id,
                        name: indicator.name,
                        unit: indicator.unit,
                        direction: indicator.direction,
                        year: indicator.year,
                        planned: indicator.planned,
                        actual: indicator.actual,
                      }}
                    />
                  ))}
                </section>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <CardTitle kicker="BSC" title="Metas" hint={`${goalRows.length} no nucleo`} />
        {goalRows.length === 0 ? (
          <EmptyNote>O ciclo cria as metas.</EmptyNote>
        ) : (
          <ul className="grid gap-2">
            {goalRows.map((goal) => (
              <li key={goal.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                <strong className="text-[#012245]">{goal.title}</strong>
                <p className="mt-1 text-xs text-slate-500">{goal.year}{goal.notes ? ` · ${goal.notes}` : ""}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <details className="mt-6 rounded-3xl border border-[#012245]/10 bg-white p-6">
        <summary className="cursor-pointer text-sm font-semibold text-[#012245]">Mercado e pesquisa</summary>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <MarketResearchForm
            clientId={id}
            defaultRegion={client.city ?? ""}
            defaultSector={client.sector ?? ""}
          />
          <div>
            {insightRows.length === 0 ? (
              <EmptyNote>Nenhuma pesquisa ainda.</EmptyNote>
            ) : (
              insightRows.map((insight) => {
                const payload = insight.payload as { contexto_mercado?: string[] };
                return (
                  <div key={insight.id} className="mb-3 rounded-2xl border border-slate-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-[#012245]">{insight.scope === "regional" ? "Regional" : "Amplo"}</strong>
                      <span className="text-xs text-slate-500">{formatDateTime(insight.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{insight.summary}</p>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                      {(payload.contexto_mercado ?? []).slice(0, 3).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </details>

      <details className="mt-4 rounded-3xl border border-[#012245]/10 bg-white p-6">
        <summary className="cursor-pointer text-sm font-semibold text-[#012245]">Incluir meta ou indicador a mao</summary>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <form action={createGoal.bind(null, id)} className="grid gap-3">
            <Field label="Titulo">
              <Input name="title" required />
            </Field>
            <Field label="Ano">
              <Input name="year" type="number" defaultValue={new Date().getFullYear()} />
            </Field>
            <Field label="Notas">
              <Textarea name="notes" rows={2} />
            </Field>
            <Button>Criar meta</Button>
          </form>
          <form action={createIndicator.bind(null, id)} className="grid gap-3">
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
                    {PERSPECTIVE_LABELS_DANIEL[perspective]}
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
            <Button>Criar indicador</Button>
          </form>
        </div>
      </details>
    </>
  );
}
