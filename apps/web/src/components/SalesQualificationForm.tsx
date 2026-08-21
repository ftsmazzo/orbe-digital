"use client";

import { useMemo, useState } from "react";
import type { SalesQualification, SalesQualificationCriterion } from "@orbe/shared";
import { Button, Field, Select, Textarea } from "@/components/ui";
import { DEFAULT_SALES_PLAYBOOK } from "@/lib/sales/playbook";

const CRITERIA: { id: SalesQualificationCriterion; label: string }[] =
  DEFAULT_SALES_PLAYBOOK.qualificationCriteria.map((c) => ({
    id: c.id as SalesQualificationCriterion,
    label: c.label,
  }));

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  initial?: SalesQualification;
  priceBook?: { id: string; name: string; minPrice: number; level: string }[];
};

export function SalesQualificationForm({ action, initial, priceBook = [] }: Props) {
  const [data, setData] = useState<SalesQualification>(
    initial ?? { decision: "pendente", criteria: {}, offerLevel: "diagnostico" },
  );
  const payload = useMemo(() => JSON.stringify(data), [data]);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="salesQualification" value={payload} />

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-[#012245]">{DEFAULT_SALES_PLAYBOOK.opening.title}</p>
        <p className="mt-2">{DEFAULT_SALES_PLAYBOOK.opening.script}</p>
      </div>

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
          <option value="diagnostico">Diagnostico</option>
          <option value="ciclo">Ciclo ORBE</option>
          <option value="premium">Premium</option>
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
