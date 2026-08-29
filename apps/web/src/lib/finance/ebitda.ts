export type MonthlyEbitdaInput = {
  year: number;
  month: number;
  revenueNet: number;
  cpv: number;
  opex: number;
  depreciation: number;
  amortization: number;
};

export function computeEbitda(row: Omit<MonthlyEbitdaInput, "year" | "month">) {
  return round2(row.revenueNet - row.cpv - row.opex + row.depreciation + row.amortization);
}

export type FeeModality = "m1" | "m6";

export type FeeScheduleItem = {
  label: string;
  dueDay: number;
  monthOffset: number;
  amount: number;
  note: string;
};

/** Honorarios 15% EBITDA conforme contrato Soluciona + modalidade M1. */
export function computeFeeSchedule(opts: {
  modality: FeeModality;
  share?: number;
  months: { year: number; month: number; ebitda: number }[];
  contractStart: Date;
}): {
  firstPayment: number;
  subsequentMonthly: number;
  annualTrueUpHint: string;
  items: FeeScheduleItem[];
} {
  const share = opts.share ?? 0.15;
  const sorted = [...opts.months].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
  const first6 = sorted.slice(0, 6);
  const accumulated6 = first6.reduce((s, m) => s + m.ebitda, 0);
  const last12 = sorted.slice(-12);
  const avg12 = last12.length ? last12.reduce((s, m) => s + m.ebitda, 0) / last12.length : 0;

  const firstPayment = opts.modality === "m6" ? share * Math.max(0, accumulated6) : share * Math.max(0, sorted[0]?.ebitda ?? 0);
  const subsequentMonthly = share * Math.max(0, avg12);

  const items: FeeScheduleItem[] =
    opts.modality === "m6"
      ? [
          {
            label: "1o pagamento (dia 10 do 6o mes)",
            dueDay: 10,
            monthOffset: 6,
            amount: round2(firstPayment),
            note: "15% do EBITDA acumulado dos 6 primeiros meses.",
          },
          {
            label: "Mensal a partir do 7o mes (dia 10)",
            dueDay: 10,
            monthOffset: 7,
            amount: round2(subsequentMonthly),
            note: "15% da media mensal de EBITDA (ate 12 meses).",
          },
        ]
      : [
          {
            label: "Mensal desde o 1o mes (dia 10)",
            dueDay: 10,
            monthOffset: 1,
            amount: round2(share * Math.max(0, avg12 || (sorted[0]?.ebitda ?? 0))),
            note: "15% do EBITDA do mes / media conforme apuracao.",
          },
        ];

  void opts.contractStart;
  return {
    firstPayment: round2(firstPayment),
    subsequentMonthly: round2(subsequentMonthly),
    annualTrueUpHint:
      "No fechamento do balanco (31/12), acertar diferenca entre o pago e 15% do EBITDA anual efetivo.",
    items,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
