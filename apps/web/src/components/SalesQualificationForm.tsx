"use client";

import { useMemo, useState } from "react";
import type { SalesQualification } from "@orbe/shared";
import { Button, Field, Select, Textarea } from "@/components/ui";
import { DEFAULT_SALES_PLAYBOOK } from "@/lib/sales/playbook";
import { scoreClient } from "@/lib/sales/score-client";

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

  const suggested = data.suggestedLabel ?? live.label;

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="salesQualification" value={payload} />

      <div
        className={`rounded-2xl border-2 p-4 text-sm ${
          suggested === "ideal"
            ? "border-emerald-300 bg-emerald-50 text-emerald-950"
            : suggested === "problema"
              ? "border-red-300 bg-red-50 text-red-950"
              : "border-amber-300 bg-amber-50 text-amber-950"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">Sugestao do sistema</p>
        <p className="mt-1 text-xl font-semibold">
          {suggested === "ideal"
            ? "Cliente ideal"
            : suggested === "problema"
              ? "Cliente problema"
              : "Ainda indefinido"}
          {typeof live.score === "number" ? ` (${live.score}/100)` : ""}
        </p>
        <p className="mt-1 opacity-80">
          {DEFAULT_SALES_PLAYBOOK.intellectualRule} Voce confirma admitir ou nao admitir abaixo.
        </p>
        {(data.suggestedReasons?.length ? data.suggestedReasons : live.reasons).length ? (
          <ul className="mt-2 list-disc pl-5">
            {(data.suggestedReasons?.length ? data.suggestedReasons : live.reasons).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </div>

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
          {DEFAULT_SALES_PLAYBOOK.qualificationCriteria.map((c) => (
            <Field key={c.id} label={c.label}>
              <p className="mb-1 text-xs text-slate-500">Ideal: {c.ideal}</p>
              <p className="mb-2 text-xs text-slate-500">Problema: {c.problema}</p>
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
                <option value="positivo">Sinal de cliente ideal</option>
                <option value="neutro">Neutro / sem evidencia</option>
                <option value="negativo">Sinal de cliente problema</option>
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

      <p className="text-xs text-slate-500">
        Historico: {learnedEvents.length} decisao(oes) admitir/recusar. Apos 3 casos os pesos dos criterios se ajustam.
      </p>
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
