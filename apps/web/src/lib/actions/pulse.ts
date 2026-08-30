export function currentMonthKey() {
  return String(new Date().getMonth() + 1).padStart(2, "0");
}

export function currentMonthLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

export function isActionOverdue(action: { status: string; dueDate?: Date | string | null }) {
  if (action.status === "concluido") return false;
  if (action.status === "atrasado") return true;
  if (!action.dueDate) return false;
  return new Date(action.dueDate).getTime() < Date.now();
}

export function monthValue(record?: Record<string, number | null> | null, key = currentMonthKey()) {
  const value = record?.[key];
  return value == null || Number.isNaN(Number(value)) ? null : Number(value);
}

export function sortByDue<T extends { dueDate?: Date | string | null }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const left = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const right = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return left - right;
  });
}
