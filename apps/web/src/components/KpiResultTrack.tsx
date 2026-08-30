"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { suggestKpiPlanned, updateIndicatorResult } from "@/app/app/actions";
import { Button, Input } from "@/components/ui";
import { currentMonthKey } from "@/lib/actions/pulse";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function monthKey(index: number) {
  return String(index + 1).padStart(2, "0");
}

function asMap(record?: Record<string, number | null> | null) {
  return Object.fromEntries(MONTHS.map((_, index) => [monthKey(index), record?.[monthKey(index)] ?? null]));
}

export function KpiResultTrack({
  clientId,
  indicator,
}: {
  clientId: string;
  indicator: {
    id: string;
    name: string;
    unit: string;
    direction: string;
    year: number;
    planned?: Record<string, number | null> | null;
    actual?: Record<string, number | null> | null;
    missing?: string;
  };
}) {
  const router = useRouter();
  const nowKey = currentMonthKey();
  const currentMonth = new Date().getMonth();
  const [planned, setPlanned] = useState(() => asMap(indicator.planned));
  const [actual, setActual] = useState(() => asMap(indicator.actual));
  const [yearOpen, setYearOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const score = useMemo(() => {
    const p = planned[nowKey];
    const a = actual[nowKey];
    if (p == null && a == null) return { label: "Sem numero neste mes", pct: null as number | null };
    if (p == null) return { label: "Real sem planejado", pct: null };
    if (a == null) return { label: "Falta o realizado", pct: 0 };
    const pct = Math.round((a / p) * 100);
    return { label: `${pct}% deste mes`, pct };
  }, [planned, actual, nowKey]);

  function setField(kind: "planned" | "actual", month: string, raw: string) {
    const value = raw.trim() === "" ? null : Number(raw);
    const next = Number.isFinite(value as number) ? (value as number) : null;
    if (kind === "planned") setPlanned((prev) => ({ ...prev, [month]: next }));
    else setActual((prev) => ({ ...prev, [month]: next }));
  }

  function save() {
    const formData = new FormData();
    for (const key of Object.keys(planned)) {
      if (planned[key] != null) formData.set(`planned_${key}`, String(planned[key]));
      if (actual[key] != null) formData.set(`actual_${key}`, String(actual[key]));
    }
    startTransition(async () => {
      setMessage("");
      await updateIndicatorResult(clientId, indicator.id, formData);
      router.refresh();
      setMessage("Gravado.");
    });
  }

  function suggest() {
    startTransition(async () => {
      setMessage("");
      const result = await suggestKpiPlanned(clientId, indicator.id);
      if (result?.error) setMessage(result.error);
      else {
        router.refresh();
        setMessage("Planejado sugerido. Confira o mes.");
      }
    });
  }

  const p = planned[nowKey];
  const a = actual[nowKey];

  return (
    <article className="rounded-2xl border border-[#012245]/10 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[#012245]">{indicator.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {indicator.unit} · {indicator.direction}
          </p>
        </div>
        <p className="text-sm font-semibold text-[#2e7271]">{score.label}</p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Planejado
          <Input
            className="py-1.5 text-sm"
            type="number"
            step="0.01"
            value={p ?? ""}
            onChange={(event) => setField("planned", nowKey, event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Realizado
          <Input
            className="py-1.5 text-sm"
            type="number"
            step="0.01"
            value={a ?? ""}
            onChange={(event) => setField("actual", nowKey, event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? "..." : "Gravar"}
          </Button>
          <Button type="button" variant="secondary" onClick={suggest} disabled={pending}>
            Sugerir
          </Button>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full bg-[#c8a04c]" style={{ width: `${Math.min(100, score.pct ?? 0)}%` }} />
      </div>
      {message ? <p className="mt-2 text-xs text-slate-600">{message}</p> : null}

      <button
        type="button"
        className="mt-3 text-xs font-semibold text-[#2e7271]"
        onClick={() => setYearOpen((open) => !open)}
      >
        {yearOpen ? "▾ Fechar ano" : "▸ Ver os 12 meses"}
      </button>

      {yearOpen ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {MONTHS.map((label, index) => {
            const key = monthKey(index);
            const isCurrent = index === currentMonth;
            return (
              <div
                key={key}
                className={`rounded-2xl border p-3 ${
                  isCurrent ? "border-[#2e7271] bg-[#2e7271]/5" : "border-slate-100 bg-[#f7f4ee]/50"
                }`}
              >
                <p className="text-xs font-semibold text-[#012245]">{label}</p>
                <label className="mt-2 block text-[11px] text-slate-500">
                  Plan.
                  <Input
                    className="mt-1 py-1.5 text-sm"
                    type="number"
                    step="0.01"
                    value={planned[key] ?? ""}
                    onChange={(event) => setField("planned", key, event.target.value)}
                  />
                </label>
                <label className="mt-2 block text-[11px] text-slate-500">
                  Real.
                  <Input
                    className="mt-1 py-1.5 text-sm"
                    type="number"
                    step="0.01"
                    value={actual[key] ?? ""}
                    onChange={(event) => setField("actual", key, event.target.value)}
                  />
                </label>
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
