/** Folha light — custo empregador estimado (sem eSocial/recibos). */

export type PayrollPersonInput = {
  name: string;
  role?: string;
  team?: string;
  salaryBase: number;
  /** Fator encargos (ex.: 1.7 = salario * 70% encargos). */
  employerCostFactor?: number;
  active?: boolean;
};

export type PayrollCostResult = {
  headcount: number;
  monthlySalaryTotal: number;
  monthlyEmployerCost: number;
  annualEmployerCost: number;
  byTeam: { team: string; cost: number; count: number }[];
};

export function computePayrollCost(people: PayrollPersonInput[]): PayrollCostResult {
  const active = people.filter((p) => p.active !== false);
  const monthlySalaryTotal = active.reduce((s, p) => s + (Number(p.salaryBase) || 0), 0);
  const monthlyEmployerCost = active.reduce(
    (s, p) => s + (Number(p.salaryBase) || 0) * (Number(p.employerCostFactor) || 1.7),
    0,
  );
  const teamMap = new Map<string, { cost: number; count: number }>();
  for (const p of active) {
    const team = p.team?.trim() || "Sem equipe";
    const cur = teamMap.get(team) ?? { cost: 0, count: 0 };
    cur.cost += (Number(p.salaryBase) || 0) * (Number(p.employerCostFactor) || 1.7);
    cur.count += 1;
    teamMap.set(team, cur);
  }
  return {
    headcount: active.length,
    monthlySalaryTotal: round2(monthlySalaryTotal),
    monthlyEmployerCost: round2(monthlyEmployerCost),
    annualEmployerCost: round2(monthlyEmployerCost * 12),
    byTeam: [...teamMap.entries()].map(([team, v]) => ({
      team,
      cost: round2(v.cost),
      count: v.count,
    })),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
