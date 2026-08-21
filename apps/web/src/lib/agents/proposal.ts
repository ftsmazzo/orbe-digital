import type { clients, diagnostics } from "@orbe/db";
import type { DiagnosticPayload } from "@orbe/shared";

type Client = typeof clients.$inferSelect;
type Diagnostic = typeof diagnostics.$inferSelect;

function list(items: unknown) {
  return Array.isArray(items) && items.length > 0
    ? items.map((item) => `<li>${String(item)}</li>`).join("")
    : "<li>A validar na proxima conversa.</li>";
}

export function generateProposalHtml(client: Client, diagnostic?: Diagnostic) {
  const payload = diagnostic?.payload as DiagnosticPayload | undefined;
  const priorities = payload?.prioridades ?? diagnostic?.priorities ?? [];
  const risks = payload?.riscos ?? diagnostic?.risks ?? [];

  return `
    <article>
      <h1>Proposta Comercial ORBE Digital - ${client.name}</h1>
      <p>Proposta para conduzir um ciclo ORBE com diagnostico, planejamento, execucao acompanhada e evidencias gerenciais.</p>
      <h2>Contexto identificado</h2>
      <p>${client.tradeName ?? client.name} apresenta oportunidades de evolucao em gestao, indicadores e cadencia de execucao.</p>
      <h2>Prioridades do ciclo</h2>
      <ul>${list(priorities)}</ul>
      <h2>Riscos a enderecar</h2>
      <ul>${list(risks)}</ul>
      <h2>Escopo sugerido</h2>
      <ol>
        <li>Diagnostico e validacao dos gaps.</li>
        <li>Definicao de metas, indicadores e plano de acao.</li>
        <li>Acompanhamento mensal com relatorios executivos.</li>
        <li>Preparacao de proximos ciclos e renovacao.</li>
      </ol>
      <h2>Investimento</h2>
      <p>Investimento a definir conforme escopo final, intensidade de acompanhamento e duracao do ciclo.</p>
    </article>
  `;
}
