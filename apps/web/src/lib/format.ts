const TZ = "America/Sao_Paulo";

export function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function pct(value: number) {
  return `${Math.round(value)}%`;
}

export const SESSION_STATUS_LABEL: Record<string, string> = {
  gravando: "Gravando",
  processando: "Processando",
  pronto: "Pronto",
  erro: "Erro",
};
