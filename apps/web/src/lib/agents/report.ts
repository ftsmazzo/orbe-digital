import type { actionItems, indicators, clients } from "@orbe/db";
import { ACTION_STATUS_LABELS, PERSPECTIVE_LABELS } from "@orbe/shared";

type Client = typeof clients.$inferSelect;
type Indicator = typeof indicators.$inferSelect;
type ActionItem = typeof actionItems.$inferSelect;

export function generateReportHtml(client: Client, indicatorRows: Indicator[], actionRows: ActionItem[], knowledge?: string) {
  const overdue = actionRows.filter((item) => item.status === "atrasado").length;
  const completed = actionRows.filter((item) => item.status === "concluido").length;

  return `
    <article>
      <h1>Relatorio ORBE - ${client.name}</h1>
      <p>Este rascunho consolida indicadores, acoes em andamento e pontos de atencao do ciclo ORBE.</p>
      <h2>Resumo executivo</h2>
      <p>${indicatorRows.length} indicadores acompanhados, ${completed} acoes concluidas e ${overdue} acoes atrasadas.</p>
      <h2>Indicadores</h2>
      <ul>
        ${indicatorRows
          .map(
            (indicator) =>
              `<li><strong>${indicator.name}</strong> (${PERSPECTIVE_LABELS[indicator.perspective]}): planejado e realizado registrados para ${indicator.year}.</li>`,
          )
          .join("")}
      </ul>
      <h2>Plano de acao</h2>
      <ul>
        ${actionRows
          .map(
            (action) =>
              `<li><strong>${action.title}</strong> - ${ACTION_STATUS_LABELS[action.status]}${action.ownerName ? `, responsavel: ${action.ownerName}` : ""}.</li>`,
          )
          .join("")}
      </ul>
      <h2>Recomendacao</h2>
      <p>Manter cadencia mensal de revisao dos indicadores, destravar acoes atrasadas e registrar evidencias de evolucao. Sem promessa de faturamento.</p>
      ${knowledge ? `<h2>Principios de referencia</h2><p>${knowledge.slice(0, 1200).replaceAll("<", "&lt;")}</p>` : ""}
    </article>
  `;
}
