"use client";

import { useMemo, useState } from "react";
import {
  SCORE360_DIMENSIONS,
  SCORE360_DIMENSION_LABELS,
  SCORE360_PROFILES,
  SCORE360_PROFILE_LABELS,
  computeScore360Total,
  type Score360,
  type Score360Dimension,
  type Score360Profile,
} from "@orbe/shared";
import { Field, Select } from "@/components/ui";

type Props = {
  value?: Score360;
  onChange: (next: Score360) => void;
};

export function Score360Editor({ value, onChange }: Props) {
  const score: Score360 = value ?? {
    perfil: "consultoria",
    dimensoes: {},
    total: 0,
  };

  const total = useMemo(
    () => computeScore360Total(score.perfil, score.dimensoes),
    [score.perfil, score.dimensoes],
  );

  function setPerfil(perfil: Score360Profile) {
    const next = { ...score, perfil, total: computeScore360Total(perfil, score.dimensoes) };
    onChange(next);
  }

  function setDim(dim: Score360Dimension, raw: number) {
    const dimensoes = { ...score.dimensoes, [dim]: raw };
    onChange({
      ...score,
      dimensoes,
      total: computeScore360Total(score.perfil, dimensoes),
    });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#012245]">Score 360</h2>
          <p className="text-sm text-slate-500">Notas 1–5 por dimensao, ponderadas pelo perfil.</p>
          {Object.keys(score.dimensoes).length === 0 ? (
            <p className="mt-2 max-w-md text-sm text-[#c0392b]">
              Ainda sem nota. O ciclo nao inventa Score 360 sem evidencia na sessao — preencha 1 a 5
              aqui ou grave mais material.
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
          <p className="text-3xl font-semibold text-[#2e7271]">
            {Object.keys(score.dimensoes).length === 0 ? "—" : total.toFixed(1)}
          </p>
        </div>
      </div>

      <div className="mt-4 max-w-xs">
        <Field label="Perfil de engajamento">
          <Select
            value={score.perfil}
            onChange={(e) => setPerfil(e.target.value as Score360Profile)}
          >
            {SCORE360_PROFILES.map((p) => (
              <option key={p} value={p}>
                {SCORE360_PROFILE_LABELS[p]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {SCORE360_DIMENSIONS.map((dim) => {
          const v = Number(score.dimensoes[dim] ?? 0);
          const pct = (v / 5) * 100;
          return (
            <div key={dim} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <label className="font-medium text-slate-700">{SCORE360_DIMENSION_LABELS[dim]}</label>
                <span className="tabular-nums text-[#012245]">{v || "—"}/5</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={v}
                className="mt-2 w-full accent-[#2e7271]"
                onChange={(e) => setDim(dim, Number(e.target.value))}
              />
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-[#c8a04c]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Wrapper que sincroniza score360 dentro do payload do diagnostico. */
export function useScore360State(initial?: Score360) {
  return useState<Score360 | undefined>(initial);
}
