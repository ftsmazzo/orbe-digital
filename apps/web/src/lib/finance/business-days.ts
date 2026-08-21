/** Dias uteis + feriados nacionais (Donna feriados / WORKDAY). */

const FIXED_BR: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: "Ano Novo" },
  { month: 4, day: 21, name: "Tiradentes" },
  { month: 5, day: 1, name: "Dia do Trabalho" },
  { month: 9, day: 7, name: "Independencia" },
  { month: 10, day: 12, name: "Nossa Senhora Aparecida" },
  { month: 11, day: 2, name: "Finados" },
  { month: 11, day: 15, name: "Proclamacao da Republica" },
  { month: 12, day: 25, name: "Natal" },
];

/** Pascal (Movable feasts approximation via Meeus). */
function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function brazilianHolidays(year: number, extraIsoDates: string[] = []): Date[] {
  const easter = easterDate(year);
  const carnival = addDays(easter, -47);
  const goodFriday = addDays(easter, -2);
  const corpus = addDays(easter, 60);
  const list = [
    ...FIXED_BR.map((h) => new Date(year, h.month - 1, h.day)),
    carnival,
    goodFriday,
    corpus,
    ...extraIsoDates
      .map((iso) => {
        const d = new Date(`${iso}T12:00:00`);
        return Number.isNaN(d.getTime()) ? null : d;
      })
      .filter((d): d is Date => Boolean(d)),
  ];
  return list;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addBusinessDays(start: Date, businessDays: number, holidays: Date[] = []): Date {
  const dir = businessDays >= 0 ? 1 : -1;
  let remaining = Math.abs(businessDays);
  const cursor = new Date(start);
  cursor.setHours(12, 0, 0, 0);
  while (remaining > 0) {
    cursor.setDate(cursor.getDate() + dir);
    const dow = cursor.getDay();
    if (dow === 0 || dow === 6) continue;
    if (holidays.some((h) => sameDay(h, cursor))) continue;
    remaining -= 1;
  }
  return cursor;
}

export function dueDateFromBusinessDays(
  startIso: string,
  businessDays: number,
  year = new Date().getFullYear(),
  extraHolidays: string[] = [],
): string {
  const start = new Date(`${startIso}T12:00:00`);
  const holidays = brazilianHolidays(year, extraHolidays);
  // Include next year holidays if span crosses
  holidays.push(...brazilianHolidays(year + 1, extraHolidays));
  const due = addBusinessDays(start, businessDays, holidays);
  return due.toISOString().slice(0, 10);
}
