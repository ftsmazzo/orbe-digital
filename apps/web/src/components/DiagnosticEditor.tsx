"use client";

import { useMemo, useState } from "react";
import type { Confidence, DiagnosticFieldValue, DiagnosticPayload } from "@orbe/shared";
import { Button, Field, Input, Textarea } from "@/components/ui";

type Props = {
  diagnosticId: string;
  version: number;
  maturity: number | null;
  gaps: string[];
  priorities: string[];
  risks: string[];
  openQuestions: string[];
  payload: DiagnosticPayload;
  validated: boolean;
  saveAction: (formData: FormData) => void | Promise<void>;
  validateAction: () => void | Promise<void>;
  planningHref: string;
};

const SECTIONS: { key: keyof DiagnosticPayload; title: string; fields: string[] }[] = [
  {
    key: "empresa",
    title: "Empresa",
    fields: ["nome", "setor", "tempo_mercado", "colaboradores", "faturamento_medio"],
  },
  {
    key: "estrategico",
    title: "Estrategico",
    fields: [
      "missao",
      "visao",
      "valores",
      "proposta_de_valor",
      "produtos_servicos",
      "diferenciais",
      "concorrentes",
    ],
  },
  {
    key: "financeiro",
    title: "Financeiro",
    fields: [
      "tem_controle",
      "fluxo_caixa",
      "dre",
      "ferramentas",
      "ticket_medio",
      "faturamento_mensal",
      "margem",
      "lucratividade",
      "inadimplencia",
    ],
  },
  {
    key: "operacional",
    title: "Operacional",
    fields: ["processos_criticos", "gargalos", "fluxo_informacao", "tecnologia", "padronizacao"],
  },
  {
    key: "comercial",
    title: "Comercial",
    fields: ["canais", "conversao", "rotina_vendas", "materiais"],
  },
  {
    key: "swot",
    title: "SWOT",
    fields: ["forcas", "fraquezas", "oportunidades", "ameacas"],
  },
];

const CONF_OPTIONS: Confidence[] = ["alta", "media", "baixa"];

function fieldValue(section: Record<string, DiagnosticFieldValue> | undefined, key: string): DiagnosticFieldValue {
  return section?.[key] ?? { value: "", confianca: "media", evidencia: "" };
}

function displayValue(value: DiagnosticFieldValue["value"]) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function DiagnosticEditor(props: Props) {
  const [payload, setPayload] = useState<DiagnosticPayload>(props.payload ?? {});
  const structured = useMemo(() => JSON.stringify(payload), [payload]);

  function updateField(sectionKey: keyof DiagnosticPayload, fieldKey: string, patch: Partial<DiagnosticFieldValue>) {
    setPayload((prev) => {
      const section = { ...((prev[sectionKey] as Record<string, DiagnosticFieldValue> | undefined) ?? {}) };
      const current = fieldValue(section, fieldKey);
      section[fieldKey] = { ...current, ...patch };
      return { ...prev, [sectionKey]: section };
    });
  }

  return (
    <form action={props.saveAction} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <input type="hidden" name="version" value={props.version} />
      <input type="hidden" name="payloadStructured" value={structured} />

      <div className="grid gap-6">
        {SECTIONS.map((section) => {
          const data = payload[section.key] as Record<string, DiagnosticFieldValue> | undefined;
          return (
            <section key={section.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#012245]">{section.title}</h2>
              <div className="mt-4 grid gap-4">
                {section.fields.map((fieldKey) => {
                  const field = fieldValue(data, fieldKey);
                  return (
                    <div key={fieldKey} className="grid gap-2 rounded-2xl bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-sm font-medium text-slate-700">{fieldKey}</label>
                        <select
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                          value={field.confianca ?? "media"}
                          onChange={(e) =>
                            updateField(section.key, fieldKey, { confianca: e.target.value as Confidence })
                          }
                        >
                          {CONF_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              confianca: {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        value={displayValue(field.value)}
                        onChange={(e) => updateField(section.key, fieldKey, { value: e.target.value || null })}
                        placeholder="Valor (vazio = nao citado)"
                      />
                      <details className="text-xs text-slate-500">
                        <summary className="cursor-pointer">Evidencia</summary>
                        <Textarea
                          className="mt-2"
                          rows={2}
                          value={field.evidencia ?? ""}
                          onChange={(e) => updateField(section.key, fieldKey, { evidencia: e.target.value })}
                          placeholder="Trecho da transcricao"
                        />
                      </details>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#012245]">Resumo operacional</h2>
          <div className="mt-4 grid gap-3">
            <Field label="Maturidade (1-5)">
              <Input name="maturity" type="number" min={1} max={5} defaultValue={props.maturity ?? ""} />
            </Field>
            <Field label="Gaps (um por linha)">
              <Textarea name="gaps" rows={4} defaultValue={props.gaps.join("\n")} />
            </Field>
            <Field label="Prioridades (uma por linha)">
              <Textarea name="priorities" rows={4} defaultValue={props.priorities.join("\n")} />
            </Field>
            <Field label="Riscos (um por linha)">
              <Textarea name="risks" rows={4} defaultValue={props.risks.join("\n")} />
            </Field>
            <Field label="Perguntas em aberto">
              <Textarea name="openQuestions" rows={4} defaultValue={props.openQuestions.join("\n")} />
            </Field>
            <Button type="submit">Salvar rascunho</Button>
          </div>
        </section>
      </div>

      <aside className="grid gap-6 self-start">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[#012245]">Validacao</h2>
          <p className="mt-2 text-sm text-slate-500">
            {props.validated
              ? "Versao validada — pode seguir para planejamento (R)."
              : "Revise evidencia e confianca antes de validar."}
          </p>
          <button
            formAction={props.validateAction}
            className="mt-4 w-full rounded-xl bg-[#2e7271] px-4 py-3 text-sm font-semibold text-white"
          >
            {props.validated ? "Revalidar versao" : "Validar diagnostico"}
          </button>
          <a
            href={props.planningHref}
            className="mt-3 block rounded-xl border border-[#012245]/15 px-4 py-3 text-center text-sm font-semibold text-[#012245]"
          >
            Ir para planejamento (R)
          </a>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[#012245]">Resumo</h2>
          <p className="mt-2 text-sm text-slate-600">Gaps: {props.gaps.length}</p>
          <p className="text-sm text-slate-600">Prioridades: {props.priorities.length}</p>
          <p className="text-sm text-slate-600">Riscos: {props.risks.length}</p>
          <p className="text-sm text-slate-600">Perguntas: {props.openQuestions.length}</p>
        </div>
      </aside>
    </form>
  );
}
