"use client";

import { useMemo, useState } from "react";
import type { SalesQualification, SalesQualificationCriterion } from "@orbe/shared";
import { Button, Field, Select, Textarea } from "@/components/ui";
import { DEFAULT_SALES_PLAYBOOK } from "@/lib/sales/playbook";
import { scoreClient } from "@/lib/sales/score-client";

const CRITERIA: { id: SalesQualificationCriterion; label: string }[] =
  DEFAULT_SALES_PLAYBOOK.qualificationCriteria.map((c) => ({
    id: c.id as SalesQualificationCriterion,
    label: c.label,
  }));

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  initial?: SalesQualification;
  priceBook?: { id: string; name: string; minPrice: number; level: string }[];
  learnedEvents?: { verdict: string; payload: Record<string, unknown> }[];
};

export function SalesQualificationForm({ action, initial, priceBook = [], learnedEvents = [] }: Props) {
  const [data, setData] = useState<SalesQualification>(
    initial ?? { decision: "pendente", criteria: {}, offerLevel: "diagnostico" },
  );
  const payload = useMemo(() => JSON.stringify(data), [data]);
  const live = useMemo(() => scoreClient(data, learnedEvents), [data, learnedEvents]);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="salesQualification" value={payload} />

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-[#012245]">{DEFAULT_SALES_PLAYBOOK.opening.title}</p>
        <p className="mt-2">{DEFAULT_SALES_PLAYBOOK.opening.script}</p>
      </div>

      <details className="rounded-2xl border border-slate-200 p-4">
        <summary className="cursor-pointer font-semibold text-[#012245]">5 abas da metodologia de vendas</summary>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          {DEFAULT_SALES_PLAYBOOK.sheets.map((sheet) => (
            <li key={sheet}>{sheet}</li>
          ))}
        </ol>
      </details>

      <details className="rounded-2xl border border-slate-200 p-4">
        <summary className="cursor-pointer font-semibold text-[#012245]">Roteiro de conversa</summary>
        <div className="mt-3 grid gap-3 text-sm">
          {DEFAULT_SALES_PLAYBOOK.sections.map((section) => (
            <div key={section.id}>
              <p className="font-medium">{section.title}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600">
                {section.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>

      <div>
        <h3 className="font-semibold text-[#012245]">Filtro admitir / nao admitir</h3>
        <div className="mt-3 grid gap-3">
          {CRITERIA.map((c) => (
            <Field key={c.id} label={c.label}>
              <Select
                value={data.criteria?.[c.id] ?? "neutro"}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    criteria: {
                      ...prev.criteria,
                      [c.id]: e.target.value as "positivo" | "negativo" | "neutro",
                    },
                  }))
                }
              >
                <option value="positivo">Sinal positivo</option>
                <option value="neutro">Neutro</option>
                <option value="negativo">Sinal de alerta</option>
              </Select>
            </Field>
          ))}
        </div>
      </div>

      <Field label="Decisao">
        <Select
          value={data.decision ?? "pendente"}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              decision: e.target.value as SalesQualification["decision"],
            }))
          }
        >
          <option value="pendente">Pendente</option>
          <option value="admitir">Admitir cliente</option>
          <option value="nao_admitir">Nao admitir</option>
        </Select>
      </Field>

      <div
        className={`rounded-2xl border p-4 text-sm ${
          live.label === "ideal"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : live.label === "problema"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-slate-200 bg-slate-50 text-slate-700"
        }`}
      >
        <p className="font-semibold">
          Sinalizacao: cliente {live.label} ({live.score}/100)
        </p>
        <ul className="mt-2 list-disc pl-5">
          {live.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs">
          Historico: {learnedEvents.length} decisao(oes) admitir/recusar. Apos 3 casos os pesos dos criterios se ajustam.
        </p>
      </div>
      <Field label="Nivel de oferta">
        <Select
          value={data.offerLevel ?? "diagnostico"}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              offerLevel: e.target.value as SalesQualification["offerLevel"],
            }))
          }
        >
          <option value="diagnostico">Diagnostico avulso</option>
          <option value="ciclo">Ciclo fee fixo</option>
          <option value="premium">Premium</option>
          <option value="success_fee">Success-fee 15% EBITDA</option>
        </Select>
      </Field>
      <Field label="Inicio da cobranca (success-fee)">
        <Select
          value={data.billingStart ?? "m6"}
          onChange={(e) =>
            setData((prev) => ({ ...prev, billingStart: e.target.value as "m1" | "m6" }))
          }
        >
          <option value="m6">Carencia: 1o pagamento no 6o mes (contrato Soluciona)</option>
          <option value="m1">Pagar 15% desde o 1o mes</option>
        </Select>
      </Field>
      <Field label="Momento de fechamento">
        <Select
          value={data.closingMoment ?? "primeira_reuniao"}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              closingMoment: e.target.value as "primeira_reuniao" | "followup",
            }))
          }
        >
          <option value="primeira_reuniao">Ja na reuniao estrategica</option>
          <option value="followup">Em follow-up</option>
        </Select>
      </Field>

      {priceBook.length ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Price book (piso)</p>
          <ul className="mt-2 space-y-1">
            {priceBook.map((item) => (
              <li key={item.id}>
                {item.name}: R$ {item.minPrice.toLocaleString("pt-BR")}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs">{DEFAULT_SALES_PLAYBOOK.pricePolicy.principle}</p>
        </div>
      ) : null}

      <Field label="Notas comerciais">
        <Textarea
          rows={3}
          value={data.notes ?? ""}
          onChange={(e) => setData((prev) => ({ ...prev, notes: e.target.value }))}
        />
      </Field>

      <Button type="submit">Salvar qualificacao comercial</Button>
    </form>
  );
}
