/** Capital de giro — logica da planilha CAPITAL DE GIRO.xlsm (sem Excel). */

export type StockItem = {
  description: string;
  quantity: number;
  unitCost: number;
};

export type PaymentTerm = {
  label: string;
  /** Percentual 0-100. */
  percent: number;
  days: number;
};

export type WorkingCapitalInput = {
  companyName?: string;
  stock: StockItem[];
  salesTerms: PaymentTerm[];
  purchaseTerms: PaymentTerm[];
  /** Dias medios de estoque. */
  inventoryDays: number;
  /** Vendas medias diarias (R$). */
  averageDailySales: number;
  /** Custos medios diarios (R$). */
  averageDailyCosts: number;
  /** Caixa minimo desejado em dias de custo. */
  minCashDays?: number;
};

export type WorkingCapitalResult = {
  stockTotal: number;
  avgSalesDays: number;
  avgPurchaseDays: number;
  inventoryDays: number;
  /** Ciclo financeiro em dias = PMV + PME - PMC */
  ncgDays: number;
  ncgAmount: number;
  minCash: number;
  totalNeed: number;
};

function weightedDays(terms: PaymentTerm[]): number {
  const totalPct = terms.reduce((s, t) => s + (Number(t.percent) || 0), 0);
  if (!totalPct) return 0;
  return terms.reduce((s, t) => s + ((Number(t.percent) || 0) * (Number(t.days) || 0)) / 100, 0);
}

export function computeWorkingCapital(input: WorkingCapitalInput): WorkingCapitalResult {
  const stockTotal = input.stock.reduce(
    (s, item) => s + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    0,
  );
  const avgSalesDays = weightedDays(input.salesTerms);
  const avgPurchaseDays = weightedDays(input.purchaseTerms);
  const inventoryDays = Number(input.inventoryDays) || 0;
  const ncgDays = avgSalesDays + inventoryDays - avgPurchaseDays;
  const daily = Number(input.averageDailySales) || 0;
  const dailyCost = Number(input.averageDailyCosts) || daily * 0.7;
  const ncgAmount = Math.max(0, ncgDays) * dailyCost;
  const minCashDays = Number(input.minCashDays ?? 15);
  const minCash = minCashDays * dailyCost;
  const totalNeed = stockTotal + ncgAmount + minCash;

  return {
    stockTotal: round2(stockTotal),
    avgSalesDays: round2(avgSalesDays),
    avgPurchaseDays: round2(avgPurchaseDays),
    inventoryDays,
    ncgDays: round2(ncgDays),
    ncgAmount: round2(ncgAmount),
    minCash: round2(minCash),
    totalNeed: round2(totalNeed),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
