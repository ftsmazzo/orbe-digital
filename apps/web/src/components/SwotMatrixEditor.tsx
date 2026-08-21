"use client";

import { useMemo, useState } from "react";
import type { SwotMatrix } from "@orbe/shared";
import { Field, Textarea } from "@/components/ui";

type Props = {
  value?: SwotMatrix;
  onChange: (next: SwotMatrix) => void;
};

function linesToList(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function listToText(list?: string[]) {
  return (list ?? []).join("\n");
}

function emptyGrid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
}

export function SwotMatrixEditor({ value, onChange }: Props) {
  const matrix: SwotMatrix = value ?? {
    forcas: [],
    fraquezas: [],
    oportunidades: [],
    ameacas: [],
    fo: [],
    fa: [],
    wo: [],
    wa: [],
  };

  const [draft, setDraft] = useState({
    forcas: listToText(matrix.forcas),
    fraquezas: listToText(matrix.fraquezas),
    oportunidades: listToText(matrix.oportunidades),
    ameacas: listToText(matrix.ameacas),
  });

  const parsed = useMemo(
    () => ({
      forcas: linesToList(draft.forcas),
      fraquezas: linesToList(draft.fraquezas),
      oportunidades: linesToList(draft.oportunidades),
      ameacas: linesToList(draft.ameacas),
    }),
    [draft],
  );

  function commitLists() {
    const fo = resizeGrid(matrix.fo, parsed.forcas.length, parsed.oportunidades.length);
    const fa = resizeGrid(matrix.fa, parsed.forcas.length, parsed.ameacas.length);
    const wo = resizeGrid(matrix.wo, parsed.fraquezas.length, parsed.oportunidades.length);
    const wa = resizeGrid(matrix.wa, parsed.fraquezas.length, parsed.ameacas.length);
    onChange({ ...parsed, fo, fa, wo, wa });
  }

  function setCell(
    key: "fo" | "fa" | "wo" | "wa",
    r: number,
    c: number,
    score: number,
  ) {
    const base = {
      ...matrix,
      forcas: parsed.forcas,
      fraquezas: parsed.fraquezas,
      oportunidades: parsed.oportunidades,
      ameacas: parsed.ameacas,
    };
    const grid = resizeGrid(base[key], rowsFor(key, parsed), colsFor(key, parsed));
    grid[r]![c] = score;
    onChange({ ...base, [key]: grid });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#012245]">SWOT cruzada</h2>
      <p className="text-sm text-slate-500">Ate 5 itens por quadrante. Scores 0 (sem efeito), 1 ou 2.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(
          [
            ["forcas", "Forcas"],
            ["fraquezas", "Fraquezas"],
            ["oportunidades", "Oportunidades"],
            ["ameacas", "Ameacas"],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={`${label} (uma por linha)`}>
            <Textarea
              rows={4}
              value={draft[key]}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              onBlur={commitLists}
            />
          </Field>
        ))}
      </div>

      <MatrixBlock
        title="Forcas x Oportunidades (FO)"
        rows={parsed.forcas}
        cols={parsed.oportunidades}
        grid={matrix.fo}
        onCell={(r, c, v) => setCell("fo", r, c, v)}
      />
      <MatrixBlock
        title="Forcas x Ameacas (FA)"
        rows={parsed.forcas}
        cols={parsed.ameacas}
        grid={matrix.fa}
        onCell={(r, c, v) => setCell("fa", r, c, v)}
      />
      <MatrixBlock
        title="Fraquezas x Oportunidades (WO)"
        rows={parsed.fraquezas}
        cols={parsed.oportunidades}
        grid={matrix.wo}
        onCell={(r, c, v) => setCell("wo", r, c, v)}
      />
      <MatrixBlock
        title="Fraquezas x Ameacas (WA)"
        rows={parsed.fraquezas}
        cols={parsed.ameacas}
        grid={matrix.wa}
        onCell={(r, c, v) => setCell("wa", r, c, v)}
      />
    </section>
  );
}

function MatrixBlock({
  title,
  rows,
  cols,
  grid,
  onCell,
}: {
  title: string;
  rows: string[];
  cols: string[];
  grid?: number[][];
  onCell: (r: number, c: number, v: number) => void;
}) {
  if (!rows.length || !cols.length) return null;
  return (
    <div className="mt-4 overflow-x-auto">
      <p className="mb-2 text-sm font-semibold text-[#012245]">{title}</p>
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-slate-200 bg-slate-50 p-2 text-left"> </th>
            {cols.map((c) => (
              <th key={c} className="border border-slate-200 bg-slate-50 p-2 text-left font-medium">
                {c.slice(0, 28)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r}>
              <td className="border border-slate-200 bg-slate-50 p-2 font-medium">{r.slice(0, 28)}</td>
              {cols.map((_, ci) => (
                <td key={`${ri}-${ci}`} className="border border-slate-200 p-1">
                  <select
                    className="w-full rounded border border-slate-200 bg-white px-1 py-1"
                    value={grid?.[ri]?.[ci] ?? 0}
                    onChange={(e) => onCell(ri, ci, Number(e.target.value))}
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                  </select>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function rowsFor(
  key: "fo" | "fa" | "wo" | "wa",
  p: { forcas: string[]; fraquezas: string[]; oportunidades: string[]; ameacas: string[] },
) {
  return key === "fo" || key === "fa" ? p.forcas.length : p.fraquezas.length;
}

function colsFor(key: "fo" | "fa" | "wo" | "wa", p: {
  forcas: string[];
  fraquezas: string[];
  oportunidades: string[];
  ameacas: string[];
}) {
  return key.endsWith("o") ? p.oportunidades.length : p.ameacas.length;
}

function resizeGrid(grid: number[][] | undefined, rows: number, cols: number) {
  const next = emptyGrid(rows, cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      next[r]![c] = grid?.[r]?.[c] ?? 0;
    }
  }
  return next;
}
