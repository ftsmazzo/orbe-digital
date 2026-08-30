"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { suggestKpiPlanned, updateIndicatorResult } from "@/app/app/actions";
import { Button, Input } from "@/components/ui";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function monthKey(index: number) {
  return String(index + 1).padStart(2, "0");
}

function asMap(record?: Record<string, number | null> | null) {
  return Object.fromEntries(MONTHS.map((_, index) => [monthKey(index), record?.[monthKey(index)] ?? null]));
}

function formatValue(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
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
  const currentMonth = new Date().getMonth();
  const [planned, setPlanned] = useState(() => asMap(indicator.planned));
  const [actual, setActual] = useState(() => asMap(indicator.actual));
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const score = useMemo(() => {
    let plan = 0;
    let real = 0;
    let paired = 0;
    for (const key of Object.keys(planned)) {
      const p = planned[key];
      const a = actual[key];
      if (p != null) plan += p;
      if (a != null) real += a;
      if (p != null && a != null) paired += 1;
    }
    if (!plan) return { label: "Sem planejado ainda", pct: null as number | null, real, plan, paired };
    const pct = Math.round((real / plan) * 100);
    if (!paired) return { label: "Meta sem realizado", pct: 0, real, plan, paired };
    return { label: `${pct}% do planejado`, pct, real, plan, paired };
  }, [planned, actual]);

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
      setMessage("Resultado gravado.");
    });
  }

  function suggest() {
    startTransition(async () => {
      setMessage("");
      const result = await suggestKpiPlanned(clientId, indicator.id);
      if (result?.error) setMessage(result.error);
      else {
        router.refresh();
        setMessage("Planejado sugerido com a evidencia que existe. Confira os meses.");
      }
    });
  }

  return (
    <article className="rounded-3xl border border-[#012245]/10 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#012245]">{indicator.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {indicator.unit} · {indicator.direction} · {indicator.year}
          </p>
        </div>
        <div className="min-w-[180px] text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">Como anda</p>
          <p className="mt-1 text-xl font-semibold text-[#012245]">{score.label}</p>
          <p className="text-xs text-slate-500">
            Plan. {formatValue(score.plan || null)} · Real. {formatValue(score.real || null)}
          </p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-[#c8a04c] transition-all"
          style={{ width: `${Math.min(100, score.pct ?? 0)}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {MONTHS.map((label, index) => {
          const key = monthKey(index);
          const isCurrent = index === currentMonth;
          const p = planned[key];
          const a = actual[key];
          const delta = p != null && a != null ? a - p : null;
          return (
            <div
              key={key}
              className={`rounded-2xl border p-3 ${
                isCurrent ? "border-[#2e7271] bg-[#2e7271]/5" : "border-slate-100 bg-[#f7f4ee]/50"
              }`}
            >
              <p className="text-xs font-semibold text-[#012245]">
                {label}
                {isCurrent ? " · agora" : ""}
              </p>
              <label className="mt-2 block text-[11px] text-slate-500">
                Planejado
                <Input
                  className="mt-1 py-1.5 text-sm"
                  type="number"
                  step="0.01"
                  value={p ?? ""}
                  onChange={(event) => setField("planned", key, event.target.value)}
                />
              </label>
              <label className="mt-2 block text-[11px] text-slate-500">
                Realizado
                <Input
                  className="mt-1 py-1.5 text-sm"
                  type="number"
                  step="0.01"
                  value={a ?? ""}
                  onChange={(event) => setField("actual", key, event.target.value)}
                />
              </label>
              <p className={`mt-2 text-[11px] ${delta == null ? "text-slate-400" : delta < 0 ? "text-red-700" : "text-[#2e7271]"}`}>
                {delta == null ? "sem confronto" : `${delta > 0 ? "+" : ""}${formatValue(delta)}`}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Gravando..." : "Gravar resultado"}
        </Button>
        <Button type="button" variant="secondary" onClick={suggest} disabled={pending}>
          Sugerir planejado
        </Button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </article>
  );
}
