import type { Perspective } from "@orbe/shared";

export type CycleKpi = {
  name: string;
  unit: string;
  direction: "aumentar" | "diminuir";
  planned: Record<string, number | null>;
  missing?: string;
};

export type CycleAction = {
  title: string;
  how: string;
  ownerName: string;
  sector: string;
};

export type CycleGoal = {
  perspective: Perspective;
  title: string;
  notes: string;
  kpis: CycleKpi[];
  actions: CycleAction[];
};

export type CycleGlobal = {
  title: string;
  notes: string;
};

export type CyclePlan = {
  globals: CycleGlobal[];
  goals: CycleGoal[];
  missing: string[];
  openQuestions: string[];
  challenges?: string[];
};
