const TZ = "America/Sao_Paulo";
const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function dayKey(value: Date | string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(value));
}

export function todayKey() {
  return dayKey(new Date());
}

export function parseYearMonth(raw?: string) {
  const match = raw?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }
  const [year, month] = todayKey().split("-").map(Number);
  return { year, month };
}

export function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: TZ }).format(
    new Date(`${year}-${pad(month)}-15T12:00:00-03:00`),
  );
}

export function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function monthQuery(year: number, month: number) {
  return `${year}-${pad(month)}`;
}

export function monthCells(year: number, month: number) {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstKey = `${year}-${pad(month)}-01`;
  const startPad = (new Date(`${firstKey}T12:00:00-03:00`).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: startPad }, () => null);
  for (let day = 1; day <= last; day += 1) cells.push(`${year}-${pad(month)}-${pad(day)}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function weekDays() {
  return WEEKDAYS;
}

export function addDaysKey(key: string, days: number) {
  const date = new Date(`${key}T12:00:00-03:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return dayKey(date);
}

export function formatAgendaTime(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatAgendaDay(key: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${key}T12:00:00-03:00`));
}

export function parseLocalDateTime(date?: string, time?: string) {
  if (!date) return undefined;
  const clock = time && /^\d{2}:\d{2}$/.test(time) ? time : "09:00";
  return new Date(`${date}T${clock}:00-03:00`);
}

export type AgendaEventKind = "prazo" | "reuniao" | "lembrete";

export type AgendaEvent = {
  id: string;
  kind: AgendaEventKind;
  title: string;
  clientId?: string | null;
  clientName?: string;
  href?: string;
  at: Date;
  endsAt?: Date | null;
  overdue?: boolean;
  appointmentId?: string;
};

export function groupByDay(events: AgendaEvent[]) {
  const map = new Map<string, AgendaEvent[]>();
  for (const event of events) {
    const key = dayKey(event.at);
    const list = map.get(key) ?? [];
    list.push(event);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.at.getTime() - b.at.getTime());
  }
  return map;
}
