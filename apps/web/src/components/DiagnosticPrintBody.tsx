import {
  SCORE360_DIMENSION_LABELS,
  SCORE360_DIMENSIONS,
  computeScore360Total,
  type DiagnosticFieldValue,
  type DiagnosticPayload,
  type GutItem,
  type IshikawaDiagram,
  type Mix4P,
  type Score360,
} from "@orbe/shared";
import { asTextList } from "@/lib/text";

const FIELD_LABELS: Record<string, string> = {
  nome: "Nome",
  setor: "Setor",
  tempo_mercado: "Tempo de mercado",
  colaboradores: "Colaboradores",
  faturamento_medio: "Faturamento medio",
  missao: "Missao",
  visao: "Visao",
  valores: "Valores",
  proposta_de_valor: "Proposta de valor",
  produtos_servicos: "Produtos e servicos",
  diferenciais: "Diferenciais",
  concorrentes: "Concorrentes",
  tem_controle: "Controle financeiro",
  fluxo_caixa: "Fluxo de caixa",
  dre: "DRE",
  ferramentas: "Ferramentas",
  ticket_medio: "Ticket medio",
  faturamento_mensal: "Faturamento mensal",
  margem: "Margem",
  lucratividade: "Lucratividade",
  inadimplencia: "Inadimplencia",
  processos_criticos: "Processos criticos",
  gargalos: "Gargalos",
  fluxo_informacao: "Fluxo de informacao",
  tecnologia: "Tecnologia",
  padronizacao: "Padronizacao",
  canais: "Canais",
  conversao: "Conversao",
  rotina_vendas: "Rotina de vendas",
  materiais: "Materiais",
  forcas: "Forcas",
  fraquezas: "Fraquezas",
  oportunidades: "Oportunidades",
  ameacas: "Ameacas",
  produto: "Produto",
  preco: "Preco",
  praca: "Praca",
  promocao: "Promocao",
};

const ISHIKAWA_ARMS: { key: keyof IshikawaDiagram; label: string }[] = [
  { key: "maoDeObra", label: "Mao de obra" },
  { key: "metodo", label: "Metodo" },
  { key: "maquina", label: "Maquina" },
  { key: "material", label: "Material" },
  { key: "medioAmbiente", label: "Meio ambiente" },
  { key: "medicao", label: "Medicao" },
];

function swotList(raw: unknown) {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "value" in (raw as object)) {
    return asTextList((raw as DiagnosticFieldValue).value).filter((item) => !isBlank(item));
  }
  return asTextList(raw).filter((item) => !isBlank(item));
}

function isBlank(value: string) {
  const text = value.trim().toLowerCase();
  return !text || text === "nao identificado" || text === "não identificado" || text === "n/a" || text === "-";
}

function fieldLines(field?: DiagnosticFieldValue | null) {
  if (!field) return [];
  const list = asTextList(field.value);
  return list.filter((item) => !isBlank(item));
}

function FieldBlock({ label, field }: { label: string; field?: DiagnosticFieldValue }) {
  const lines = fieldLines(field);
  if (!lines.length) return null;
  return (
    <div className="mb-2">
      <p>
        <strong>{label}:</strong> {lines.join("; ")}
      </p>
      {field?.evidencia && !isBlank(field.evidencia) ? (
        <p className="text-[10pt] text-[#2e7271]">Evidencia na sessao: {field.evidencia}</p>
      ) : null}
    </div>
  );
}

function SectionFields({
  title,
  section,
  keys,
}: {
  title: string;
  section?: Record<string, DiagnosticFieldValue>;
  keys: string[];
}) {
  const blocks = keys
    .map((key) => ({ key, field: section?.[key] }))
    .filter((row) => fieldLines(row.field).length);
  if (!blocks.length) return null;
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 text-[13pt] font-semibold text-[#2e7271]">{title}</h2>
      {blocks.map((row) => (
        <FieldBlock key={row.key} label={FIELD_LABELS[row.key] ?? row.key} field={row.field} />
      ))}
    </section>
  );
}

function gutRows(items?: GutItem[]) {
  return (items ?? [])
    .map((item) => ({
      ...item,
      score: item.score ?? item.gravidade * item.urgencia * item.tendencia,
    }))
    .filter((item) => item.item?.trim())
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

function ListSection({ title, items }: { title: string; items?: string[] | null }) {
  const rows = asTextList(items).filter((item) => !isBlank(item));
  if (!rows.length) return null;
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 text-[13pt] font-semibold text-[#2e7271]">{title}</h2>
      <ol className="list-decimal space-y-1 pl-5">
        {rows.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}

function MixSection({ mix }: { mix?: Mix4P }) {
  if (!mix) return null;
  const keys = ["produto", "preco", "praca", "promocao"] as const;
  const filled = keys.filter((key) => fieldLines(mix[key]).length);
  if (!filled.length) return null;
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 text-[13pt] font-semibold text-[#2e7271]">Composto comercial (4Ps)</h2>
      <p className="mb-2 text-[10pt] text-[#2e7271]">
        Produto, preco, praca e promocao — so o que a conversa sustentou.
      </p>
      {filled.map((key) => (
        <FieldBlock key={key} label={FIELD_LABELS[key]} field={mix[key]} />
      ))}
    </section>
  );
}

function ScoreSection({ score }: { score?: Score360 }) {
  if (!score) return null;
  const dims = SCORE360_DIMENSIONS.map((dim) => ({
    dim,
    note: Number(score.dimensoes?.[dim] ?? 0),
  })).filter((row) => row.note > 0);
  if (!dims.length) return null;
  const total = score.total ?? computeScore360Total(score.perfil ?? "consultoria", score.dimensoes ?? {});
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 text-[13pt] font-semibold text-[#2e7271]">Leitura 360</h2>
      <p className="mb-2 text-[10pt] text-[#2e7271]">
        Notas de 1 a 5 por dimensao, so com evidencia. Total ponderado: {total.toFixed(0)} de 100.
      </p>
      <table className="w-full border-collapse text-[11pt]">
        <thead>
          <tr className="bg-[#f7f4ee] text-left">
            <th className="border border-[#012245]/20 px-2 py-1.5">Dimensao</th>
            <th className="border border-[#012245]/20 px-2 py-1.5">Nota</th>
          </tr>
        </thead>
        <tbody>
          {dims.map((row) => (
            <tr key={row.dim}>
              <td className="border border-[#012245]/20 px-2 py-1.5">{SCORE360_DIMENSION_LABELS[row.dim]}</td>
              <td className="border border-[#012245]/20 px-2 py-1.5">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function IshikawaSection({ diagram }: { diagram?: IshikawaDiagram }) {
  if (!diagram?.problema?.trim()) return null;
  const arms = ISHIKAWA_ARMS.map((arm) => ({
    ...arm,
    items: asTextList(diagram[arm.key]).filter((item) => !isBlank(item)),
  })).filter((arm) => arm.items.length);
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 text-[13pt] font-semibold text-[#2e7271]">Causa do problema priorizado</h2>
      <p className="mb-2">
        <strong>Problema:</strong> {diagram.problema}
      </p>
      {arms.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {arms.map((arm) => (
            <div key={arm.key} className="rounded-xl border border-[#012245]/15 p-3">
              <p className="font-semibold">{arm.label}</p>
              <ul className="mt-1 list-disc pl-5 text-[11pt]">
                {arm.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10pt] text-[#2e7271]">Causas ainda sem evidencia suficiente na sessao.</p>
      )}
    </section>
  );
}

export function DiagnosticPrintBody({
  payload,
  priorities,
  risks,
  gaps,
  openQuestions,
  version,
  createdAt,
}: {
  payload: DiagnosticPayload;
  priorities?: string[] | null;
  risks?: string[] | null;
  gaps?: string[] | null;
  openQuestions?: string[] | null;
  version: number;
  createdAt?: Date | string | null;
}) {
  const gut = gutRows(payload.gut);
  const top = gut[0];
  const swot = payload.swotMatrix ?? payload.swot;
  const forcas = swotList((swot as { forcas?: unknown })?.forcas);
  const fraquezas = swotList((swot as { fraquezas?: unknown })?.fraquezas);
  const oportunidades = swotList((swot as { oportunidades?: unknown })?.oportunidades);
  const ameacas = swotList((swot as { ameacas?: unknown })?.ameacas);
  const hasSwot = forcas.length || fraquezas.length || oportunidades.length || ameacas.length;
  const dateLabel = createdAt
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(createdAt))
    : null;

  return (
    <article className="text-[12pt] leading-[1.5]">
      <h1 className="mb-1 text-[18pt] font-semibold">Diagnostico ORBE</h1>
      <p className="mb-4 text-[10pt] text-[#2e7271]">
        Versao {version}
        {dateLabel ? ` · ${dateLabel}` : ""} · Entrega ao cliente. O que nao teve evidencia na sessao nao entra como fato.
      </p>

      <p className="mb-6">
        Este diagnostico organiza o que a reuniao sustentou: quem e a empresa, o que dói agora, por que dói e por onde
        comecar. As ferramentas (GUT, causa 6M, SWOT, 4Ps e leitura 360) servem para decidir — nao para encher pagina.
      </p>

      {top ? (
        <section className="mb-6 rounded-2xl border border-[#c8a04c] bg-[#c8a04c]/10 p-4 break-inside-avoid">
          <p className="text-[10pt] font-semibold uppercase tracking-[0.2em] text-[#2e7271]">Comecar por aqui</p>
          <p className="mt-1 text-[14pt] font-semibold">{top.item}</p>
          <p className="mt-1 text-[10pt] text-[#2e7271]">
            Prioridade GUT {top.score} (gravidade {top.gravidade} × urgencia {top.urgencia} × tendencia {top.tendencia}).
          </p>
        </section>
      ) : null}

      <SectionFields
        title="A empresa"
        section={payload.empresa}
        keys={["nome", "setor", "tempo_mercado", "colaboradores", "faturamento_medio"]}
      />

      {gut.length ? (
        <section className="mb-6 break-inside-avoid">
          <h2 className="mb-2 text-[13pt] font-semibold text-[#2e7271]">Prioridade (GUT)</h2>
          <p className="mb-2 text-[10pt] text-[#2e7271]">
            Gravidade, urgencia e tendencia de 1 a 5. Score = G × U × T. O maior score e o primeiro a atacar.
          </p>
          <table className="w-full border-collapse text-[11pt]">
            <thead>
              <tr className="bg-[#f7f4ee] text-left">
                <th className="border border-[#012245]/20 px-2 py-1.5">Problema</th>
                <th className="border border-[#012245]/20 px-2 py-1.5">G</th>
                <th className="border border-[#012245]/20 px-2 py-1.5">U</th>
                <th className="border border-[#012245]/20 px-2 py-1.5">T</th>
                <th className="border border-[#012245]/20 px-2 py-1.5">Score</th>
              </tr>
            </thead>
            <tbody>
              {gut.map((item, index) => (
                <tr key={item.item} className={index === 0 ? "bg-[#c8a04c]/15 font-semibold" : ""}>
                  <td className="border border-[#012245]/20 px-2 py-1.5">{item.item}</td>
                  <td className="border border-[#012245]/20 px-2 py-1.5">{item.gravidade}</td>
                  <td className="border border-[#012245]/20 px-2 py-1.5">{item.urgencia}</td>
                  <td className="border border-[#012245]/20 px-2 py-1.5">{item.tendencia}</td>
                  <td className="border border-[#012245]/20 px-2 py-1.5">{item.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <IshikawaSection diagram={payload.ishikawa} />

      {hasSwot ? (
        <section className="mb-6 break-inside-avoid">
          <h2 className="mb-2 text-[13pt] font-semibold text-[#2e7271]">SWOT</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#012245]/15 p-3">
              <p className="font-semibold text-[#2e7271]">Forcas</p>
              <ul className="mt-1 list-disc pl-5 text-[11pt]">
                {forcas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {!forcas.length ? <li className="text-slate-400">Sem evidencia</li> : null}
              </ul>
            </div>
            <div className="rounded-xl border border-[#012245]/15 p-3">
              <p className="font-semibold text-[#2e7271]">Fraquezas</p>
              <ul className="mt-1 list-disc pl-5 text-[11pt]">
                {fraquezas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {!fraquezas.length ? <li className="text-slate-400">Sem evidencia</li> : null}
              </ul>
            </div>
            <div className="rounded-xl border border-[#012245]/15 p-3">
              <p className="font-semibold text-[#2e7271]">Oportunidades</p>
              <ul className="mt-1 list-disc pl-5 text-[11pt]">
                {oportunidades.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {!oportunidades.length ? <li className="text-slate-400">Sem evidencia</li> : null}
              </ul>
            </div>
            <div className="rounded-xl border border-[#012245]/15 p-3">
              <p className="font-semibold text-[#2e7271]">Ameacas</p>
              <ul className="mt-1 list-disc pl-5 text-[11pt]">
                {ameacas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {!ameacas.length ? <li className="text-slate-400">Sem evidencia</li> : null}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <SectionFields
        title="Estrategico"
        section={payload.estrategico}
        keys={["missao", "visao", "valores", "proposta_de_valor", "produtos_servicos", "diferenciais", "concorrentes"]}
      />
      <SectionFields
        title="Financeiro"
        section={payload.financeiro}
        keys={["tem_controle", "fluxo_caixa", "dre", "ferramentas", "ticket_medio", "faturamento_mensal", "margem", "lucratividade", "inadimplencia"]}
      />
      <SectionFields
        title="Operacional"
        section={payload.operacional}
        keys={["processos_criticos", "gargalos", "fluxo_informacao", "tecnologia", "padronizacao"]}
      />
      <SectionFields title="Comercial" section={payload.comercial} keys={["canais", "conversao", "rotina_vendas", "materiais"]} />
      <MixSection mix={payload.mix4p} />
      <ScoreSection score={payload.score360} />
      <ListSection title="Gaps" items={gaps} />
      <ListSection title="Prioridades de trabalho" items={priorities ?? payload.prioridades} />
      <ListSection title="Riscos" items={risks ?? payload.riscos} />
      <ListSection title="Perguntas em aberto" items={openQuestions ?? payload.perguntas_em_aberto} />
      <ListSection title="Acoes candidatas" items={payload.acoes_candidatas} />

      <p className="mt-8 text-[10pt] text-[#2e7271]">
        Este documento nao promete faturamento. Numero so aparece se esteve na sessao ou em DRE. A proxima etapa e o
        planejamento (metas, indicadores e 5W2H) a partir da prioridade GUT.
      </p>
    </article>
  );
}
