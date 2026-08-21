"use client";

import { useMemo, useState } from "react";
import type { WorkingCapitalInput, WorkingCapitalResult } from "@/lib/finance/working-capital";
import { computeWorkingCapital } from "@/lib/finance/working-capital";
import { Button, Field, Input } from "@/components/ui";

type Props = {
  clientName: string;
  action: (formData: FormData) => void | Promise<void>;
  initial?: { input: WorkingCapitalInput; result: WorkingCapitalResult };
};

const emptyInput = (companyName: string): WorkingCapitalInput => ({
  companyName,
  stock: [{ description: "Estoque principal", quantity: 0, unitCost: 0 }],
  salesTerms: [
    { label: "A vista", percent: 30, days: 0 },
    { label: "Prazo 1", percent: 40, days: 14 },
    { label: "Prazo 2", percent: 30, days: 30 },
  ],
  purchaseTerms: [
    { label: "A vista", percent: 20, days: 0 },
    { label: "Fornecedor", percent: 80, days: 28 },
  ],
  inventoryDays: 20,
  averageDailySales: 1000,
  averageDailyCosts: 700,
  minCashDays: 15,
});

export function WorkingCapitalForm({ clientName, action, initial }: Props) {
  const [input, setInput] = useState<WorkingCapitalInput>(initial?.input ?? emptyInput(clientName));
  const live = useMemo(() => computeWorkingCapital(input), [input]);
  const payload = useMemo(() => JSON.stringify(input), [input]);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <input type="hidden" name="payload" value={payload} />
      <div className="grid gap-4">
        <Field label="Empresa">
          <Input
            value={input.companyName ?? ""}
            onChange={(e) => setInput({ ...input, companyName: e.target.value })}
          />
        </Field>

        <section className="rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold text-[#012245]">A) Estoque inicial</h3>
          {input.stock.map((item, idx) => (
            <div key={idx} className="mt-3 grid grid-cols-3 gap-2">
              <Input
                placeholder="Descricao"
                value={item.description}
                onChange={(e) => {
                  const stock = [...input.stock];
                  stock[idx] = { ...item, description: e.target.value };
                  setInput({ ...input, stock });
                }}
              />
              <Input
                type="number"
                placeholder="Qtd"
                value={item.quantity}
                onChange={(e) => {
                  const stock = [...input.stock];
                  stock[idx] = { ...item, quantity: Number(e.target.value) };
                  setInput({ ...input, stock });
                }}
              />
              <Input
                type="number"
                placeholder="Custo unit."
                value={item.unitCost}
                onChange={(e) => {
                  const stock = [...input.stock];
                  stock[idx] = { ...item, unitCost: Number(e.target.value) };
                  setInput({ ...input, stock });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-[#2e7271]"
            onClick={() =>
              setInput({
                ...input,
                stock: [...input.stock, { description: "", quantity: 0, unitCost: 0 }],
              })
            }
          >
            + item
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold text-[#012245]">B) Prazos de venda / compra</h3>
          <p className="mt-1 text-xs text-slate-500">% das vendas e dias de recebimento</p>
          {input.salesTerms.map((t, idx) => (
            <div key={`s-${idx}`} className="mt-2 grid grid-cols-3 gap-2">
              <Input value={t.label} readOnly />
              <Input
                type="number"
                value={t.percent}
                onChange={(e) => {
                  const salesTerms = [...input.salesTerms];
                  salesTerms[idx] = { ...t, percent: Number(e.target.value) };
                  setInput({ ...input, salesTerms });
                }}
              />
              <Input
                type="number"
                value={t.days}
                onChange={(e) => {
                  const salesTerms = [...input.salesTerms];
                  salesTerms[idx] = { ...t, days: Number(e.target.value) };
                  setInput({ ...input, salesTerms });
                }}
              />
            </div>
          ))}
          <p className="mt-3 text-xs text-slate-500">% das compras e dias de pagamento</p>
          {input.purchaseTerms.map((t, idx) => (
            <div key={`p-${idx}`} className="mt-2 grid grid-cols-3 gap-2">
              <Input value={t.label} readOnly />
              <Input
                type="number"
                value={t.percent}
                onChange={(e) => {
                  const purchaseTerms = [...input.purchaseTerms];
                  purchaseTerms[idx] = { ...t, percent: Number(e.target.value) };
                  setInput({ ...input, purchaseTerms });
                }}
              />
              <Input
                type="number"
                value={t.days}
                onChange={(e) => {
                  const purchaseTerms = [...input.purchaseTerms];
                  purchaseTerms[idx] = { ...t, days: Number(e.target.value) };
                  setInput({ ...input, purchaseTerms });
                }}
              />
            </div>
          ))}
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Dias medios de estoque">
            <Input
              type="number"
              value={input.inventoryDays}
              onChange={(e) => setInput({ ...input, inventoryDays: Number(e.target.value) })}
            />
          </Field>
          <Field label="Caixa minimo (dias de custo)">
            <Input
              type="number"
              value={input.minCashDays ?? 15}
              onChange={(e) => setInput({ ...input, minCashDays: Number(e.target.value) })}
            />
          </Field>
          <Field label="Vendas medias diarias (R$)">
            <Input
              type="number"
              value={input.averageDailySales}
              onChange={(e) => setInput({ ...input, averageDailySales: Number(e.target.value) })}
            />
          </Field>
          <Field label="Custos medios diarios (R$)">
            <Input
              type="number"
              value={input.averageDailyCosts}
              onChange={(e) => setInput({ ...input, averageDailyCosts: Number(e.target.value) })}
            />
          </Field>
        </div>
        <Button type="submit">Salvar capital de giro</Button>
      </div>

      <aside className="self-start rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-[#012245]">Resultado</h3>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt>Estoque</dt><dd>R$ {live.stockTotal.toLocaleString("pt-BR")}</dd></div>
          <div className="flex justify-between gap-3"><dt>PMV (dias)</dt><dd>{live.avgSalesDays}</dd></div>
          <div className="flex justify-between gap-3"><dt>PMC (dias)</dt><dd>{live.avgPurchaseDays}</dd></div>
          <div className="flex justify-between gap-3"><dt>PME (dias)</dt><dd>{live.inventoryDays}</dd></div>
          <div className="flex justify-between gap-3"><dt>NCG (dias)</dt><dd>{live.ncgDays}</dd></div>
          <div className="flex justify-between gap-3"><dt>NCG (R$)</dt><dd>R$ {live.ncgAmount.toLocaleString("pt-BR")}</dd></div>
          <div className="flex justify-between gap-3"><dt>Caixa minimo</dt><dd>R$ {live.minCash.toLocaleString("pt-BR")}</dd></div>
          <div className="flex justify-between gap-3 border-t border-slate-100 pt-2 font-semibold"><dt>Necessidade total</dt><dd>R$ {live.totalNeed.toLocaleString("pt-BR")}</dd></div>
        </dl>
      </aside>
    </form>
  );
}
