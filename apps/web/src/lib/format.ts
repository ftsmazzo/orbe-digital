import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "-";
  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function pct(value: number) {
  return `${Math.round(value)}%`;
}
