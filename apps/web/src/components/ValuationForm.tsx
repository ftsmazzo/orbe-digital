"use client";

import { useMemo, useState } from "react";
import type { ValuationInput, ValuationResult } from "@/lib/finance/valuation";
import { computeValuation } from "@/lib/finance/valuation";
import { Button, Field, Input } from "@/components/ui";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  initial?: { input: ValuationInput; result: ValuationResult };
  suggestedPayroll?: number;
  suggestedWorkingCapital?: number;
};

function defaultInput(payroll: number, wc: number): ValuationInput {
  return {
    title: "Cenario 12 meses",
    year: new Date().getFullYear(),
    opportunityRate: 0.14,
    revenueLines: [
      { name: "Linha principal", units: Array(12).fill(100), unitPrice: 150 },
    ],
    cogsPercent: 35,
    fixedOpexMonthly: 5000,
    payrollMonthly: payroll || 8000,
    marketingMonthly: 2000,
    initialInvestment: 50000,
    workingCapital: wc || 20000,
    taxPercent: 6,
  };
}

export function ValuationForm({ action, initial, suggestedPayroll = 0, suggestedWorkingCapital = 0 }: Props) {
  const [input, setInput] = useState<ValuationInput>(
    initial?.input ?? defaultInput(suggestedPayroll, suggestedWorkingCapital),
  );
  const live = useMemo(() => computeValuation(input), [input]);
  const payload = useMemo(() => JSON.stringify(input), [input]);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <input type="hidden" name="payload" value={payload} />
      <div className="grid gap-4">
        <Field label="Titulo do cenario">
          <Input value={input.title} onChange={(e) => setInput({ ...input, title: e.target.value })} />
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Taxa de oportunidade (anual)">
            <Input
              type="number"
              step="0.01"
              value={input.opportunityRate}
              onChange={(e) => setInput({ ...input, opportunityRate: Number(e.target.value) })}
            />
          </Field>
          <Field label="Impostos %">
            <Input
              type="number"
              value={input.taxPercent}
              onChange={(e) => setInput({ ...input, taxPercent: Number(e.target.value) })}
            />
          </Field>
          <Field label="CMV / custos variaveis %">
            <Input
              type="number"
              value={input.cogsPercent}
              onChange={(e) => setInput({ ...input, cogsPercent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Investimento inicial">
            <Input
              type="number"
              value={input.initialInvestment}
              onChange={(e) => setInput({ ...input, initialInvestment: Number(e.target.value) })}
            />
          </Field>
          <Field label="Capital de giro">
            <Input
              type="number"
              value={input.workingCapital}
              onChange={(e) => setInput({ ...input, workingCapital: Number(e.target.value) })}
            />
          </Field>
          <Field label="Opex fixo mensal">
            <Input
              type="number"
              value={input.fixedOpexMonthly}
              onChange={(e) => setInput({ ...input, fixedOpexMonthly: Number(e.target.value) })}
            />
          </Field>
          <Field label="Folha mensal">
            <Input
              type="number"
              value={input.payrollMonthly}
              onChange={(e) => setInput({ ...input, payrollMonthly: Number(e.target.value) })}
            />
          </Field>
          <Field label="Marketing mensal">
            <Input
              type="number"
              value={input.marketingMonthly}
              onChange={(e) => setInput({ ...input, marketingMonthly: Number(e.target.value) })}
            />
          </Field>
        </div>

        <section className="rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold text-[#012245]">Receita — linhas</h3>
          {input.revenueLines.map((line, idx) => (
            <div key={idx} className="mt-3 grid gap-2 md:grid-cols-[1fr_120px_1fr]">
              <Input
                value={line.name}
                onChange={(e) => {
                  const revenueLines = [...input.revenueLines];
                  revenueLines[idx] = { ...line, name: e.target.value };
                  setInput({ ...input, revenueLines });
                }}
              />
              <Input
                type="number"
                value={line.unitPrice}
                onChange={(e) => {
                  const revenueLines = [...input.revenueLines];
                  revenueLines[idx] = { ...line, unitPrice: Number(e.target.value) };
                  setInput({ ...input, revenueLines });
                }}
              />
              <Input
                type="number"
                value={line.units[0] ?? 0}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  const revenueLines = [...input.revenueLines];
                  revenueLines[idx] = { ...line, units: Array(12).fill(n) };
                  setInput({ ...input, revenueLines });
                }}
                placeholder="Unidades/mes (aplica 12 meses)"
              />
            </div>
          ))}
        </section>
        <Button type="submit">Salvar valuation</Button>
      </div>

      <aside className="self-start rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-[#012245]">Indicadores</h3>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Receita anual</dt><dd>R$ {live.annualRevenue.toLocaleString("pt-BR")}</dd></div>
          <div className="flex justify-between"><dt>Resultado op. anual</dt><dd>R$ {live.annualOperatingResult.toLocaleString("pt-BR")}</dd></div>
          <div className="flex justify-between"><dt>VPL</dt><dd>R$ {live.npv.toLocaleString("pt-BR")}</dd></div>
          <div className="flex justify-between"><dt>TIR mensal %</dt><dd>{live.irr ?? "—"}</dd></div>
          <div className="flex justify-between"><dt>Payback (meses)</dt><dd>{live.paybackMonths ?? "—"}</dd></div>
          <div className="flex justify-between"><dt>Breakeven mes</dt><dd>{live.breakevenMonth ?? "—"}</dd></div>
        </dl>
        <div className="mt-4 max-h-64 overflow-auto text-xs">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1">Mes</th>
                <th>Receita</th>
                <th>FC</th>
              </tr>
            </thead>
            <tbody>
              {live.months.map((m) => (
                <tr key={m.month} className="border-t border-slate-100">
                  <td className="py-1">{m.month}</td>
                  <td>{m.revenue.toLocaleString("pt-BR")}</td>
                  <td>{m.freeCashFlow.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>
    </form>
  );
}
