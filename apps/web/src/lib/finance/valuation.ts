/** Valuation simplificado — logica VALUATION UNIDADES (12 meses). */

export type RevenueLine = {
  name: string;
  /** Unidades por mes (12). */
  units: number[];
  unitPrice: number;
};

export type ValuationInput = {
  title: string;
  year: number;
  /** Taxa de oportunidade anual (ex.: 0.14). */
  opportunityRate: number;
  revenueLines: RevenueLine[];
  /** Custo variavel % sobre receita bruta. */
  cogsPercent: number;
  /** Despesas operacionais fixas mensais. */
  fixedOpexMonthly: number;
  /** Folha mensal (MO). */
  payrollMonthly: number;
  /** Marketing mensal. */
  marketingMonthly: number;
  /** Investimento inicial (mes 0). */
  initialInvestment: number;
  /** Capital de giro inicial. */
  workingCapital: number;
  /** Impostos % sobre receita. */
  taxPercent: number;
  /** Churn nao usado no DRE simplificado; reservado. */
  churnRate?: number;
};

export type ValuationMonth = {
  month: number;
  revenue: number;
  taxes: number;
  cogs: number;
  grossProfit: number;
  opex: number;
  payroll: number;
  marketing: number;
  operatingResult: number;
  freeCashFlow: number;
};

export type ValuationResult = {
  months: ValuationMonth[];
  annualRevenue: number;
  annualOperatingResult: number;
  npv: number;
  irr: number | null;
  paybackMonths: number | null;
  breakevenMonth: number | null;
};

export function computeValuation(input: ValuationInput): ValuationResult {
  const months: ValuationMonth[] = [];
  const cashFlows: number[] = [-Math.abs(input.initialInvestment + input.workingCapital)];

  for (let m = 0; m < 12; m++) {
    const revenue = input.revenueLines.reduce(
      (s, line) => s + (Number(line.units[m]) || 0) * (Number(line.unitPrice) || 0),
      0,
    );
    const taxes = revenue * (input.taxPercent / 100);
    const cogs = revenue * (input.cogsPercent / 100);
    const grossProfit = revenue - taxes - cogs;
    const opex = input.fixedOpexMonthly;
    const payroll = input.payrollMonthly;
    const marketing = input.marketingMonthly;
    const operatingResult = grossProfit - opex - payroll - marketing;
    const freeCashFlow = operatingResult;
    cashFlows.push(freeCashFlow);
    months.push({
      month: m + 1,
      revenue: round2(revenue),
      taxes: round2(taxes),
      cogs: round2(cogs),
      grossProfit: round2(grossProfit),
      opex: round2(opex),
      payroll: round2(payroll),
      marketing: round2(marketing),
      operatingResult: round2(operatingResult),
      freeCashFlow: round2(freeCashFlow),
    });
  }

  const annualRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const annualOperatingResult = months.reduce((s, m) => s + m.operatingResult, 0);
  const monthlyRate = Math.pow(1 + input.opportunityRate, 1 / 12) - 1;
  const npv = npvOf(cashFlows, monthlyRate);
  const irr = irrOf(cashFlows);
  const paybackMonths = paybackOf(cashFlows);
  const breakevenMonth = months.find((m) => m.operatingResult >= 0)?.month ?? null;

  return {
    months,
    annualRevenue: round2(annualRevenue),
    annualOperatingResult: round2(annualOperatingResult),
    npv: round2(npv),
    irr: irr === null ? null : round2(irr * 100),
    paybackMonths,
    breakevenMonth,
  };
}

function npvOf(cashFlows: number[], rate: number) {
  return cashFlows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
}

/** IRR mensal via Newton; retorna taxa mensal. */
function irrOf(cashFlows: number[]): number | null {
  let rate = 0.01;
  for (let i = 0; i < 50; i++) {
    let npv = 0;
    let d = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const denom = Math.pow(1 + rate, t);
      npv += cashFlows[t]! / denom;
      if (t > 0) d -= (t * cashFlows[t]!) / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(d) < 1e-12) break;
    const next = rate - npv / d;
    if (!Number.isFinite(next)) return null;
    if (Math.abs(next - rate) < 1e-7) return next;
    rate = next;
  }
  return Number.isFinite(rate) ? rate : null;
}

function paybackOf(cashFlows: number[]): number | null {
  let cum = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    cum += cashFlows[t]!;
    if (cum >= 0) return t;
  }
  return null;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
