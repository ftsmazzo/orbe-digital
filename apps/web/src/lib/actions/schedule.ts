import type { Perspective } from "@orbe/shared";
import { addBusinessDays, brazilianHolidays } from "@/lib/finance/business-days";

const DEFAULT_DAYS: Record<Perspective, number> = {
  financeira: 15,
  clientes: 10,
  processos: 10,
  aprendizagem: 20,
};

function holidaysFor(year: number, extra: string[] = []) {
  return [...brazilianHolidays(year, extra), ...brazilianHolidays(year + 1, extra)];
}

export function suggestBusinessDays(opts: {
  perspective?: string | null;
  title?: string | null;
  how?: string | null;
  hinted?: number | null;
}) {
  if (opts.hinted && opts.hinted >= 3 && opts.hinted <= 45) return Math.round(opts.hinted);
  const text = `${opts.title ?? ""} ${opts.how ?? ""}`.toLowerCase();
  if (/urg|esta semana|imediato|hoje|amanha|amanhã/.test(text)) return 5;
  if (/rotina|semanal|checklist|ritual/.test(text)) return 5;
  if (/reestrutur|governan|cultura|contrato|organograma/.test(text)) return 20;
  if (/diagnost|organiz|padron/.test(text)) return 10;
  const perspective = opts.perspective as Perspective | undefined;
  return (perspective && DEFAULT_DAYS[perspective]) || 10;
}

export function toDateInput(value?: Date | string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

export function scheduleActionWindow(opts: {
  perspective?: string | null;
  title?: string | null;
  how?: string | null;
  hintedDays?: number | null;
  index: number;
  extraHolidays?: string[];
  from?: Date;
}) {
  const days = suggestBusinessDays({
    perspective: opts.perspective,
    title: opts.title,
    how: opts.how,
    hinted: opts.hintedDays,
  });
  const from = opts.from ?? new Date();
  const year = from.getFullYear();
  const holidays = holidaysFor(year, opts.extraHolidays);
  const start = addBusinessDays(from, 1 + opts.index * 3, holidays);
  const due = addBusinessDays(start, days, holidays);
  return {
    businessDays: days,
    startDate: toDateInput(start),
    dueDate: toDateInput(due),
  };
}

export function replaceQuando(how: string | null | undefined, window: { businessDays: number; startDate: string; dueDate: string }) {
  const line = `Quando: ${window.businessDays} dias uteis · ${window.startDate} a ${window.dueDate} (sugerido pelo ORBE).`;
  const text = how?.trim() ?? "";
  if (/quando:/i.test(text)) return text.replace(/quando:.*$/im, line);
  return text ? `${text}\n${line}` : line;
}
