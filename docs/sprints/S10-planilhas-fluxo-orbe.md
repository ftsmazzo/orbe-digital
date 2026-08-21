# S10 — Planilhas do Daniel no fluxo ORBE

## Objetivo

Digitalizar as planilhas de `Contexto/` no ciclo O→R→B→E **sem** embutir Excel: engines TypeScript + UI + artifacts versionados.

## Mapeamento

| Planilha | Modulo no app |
|----------|---------------|
| Metodologia de vendas | Qualificacao no cliente + `/app/settings` (price book) |
| Diagnostico 360 Score | Score 360 no editor de diagnostico |
| Planejamento Donna | Gaps: SWOT cruzada, equipes, dias uteis, mapa BSC, CTA rascunho |
| Capital de giro | `/app/clients/[id]/finance/working-capital` |
| Valuation | `/app/clients/[id]/finance/valuation` |
| Folha | `/app/clients/[id]/finance/payroll` (custo empregador only) |

## Schema

- `organizations.settings` (jsonb)
- `clients.teams`, `clients.salesQualification`
- `client_artifacts` (kind: working_capital | valuation | payroll_cost | …)
- `client_people`

## Engines

- `apps/web/src/lib/finance/working-capital.ts`
- `apps/web/src/lib/finance/valuation.ts`
- `apps/web/src/lib/finance/payroll-cost.ts`
- `apps/web/src/lib/finance/business-days.ts`
- `apps/web/src/lib/sales/playbook.ts`
- Score: `computeScore360Total` em `@orbe/shared`

## Fluxo UX

1. Lead → checklist admitir + price book  
2. Sessao → diagnostico + Score 360 + SWOT cruzada  
3. CTA → rascunho metas/KPIs/PAs  
4. Capital de giro / Valuation / Folha light conforme necessidade  
5. Dashboard → mapa BSC por perspectiva  

## Fora de escopo

Recibos, eSocial, VBA/Excel, valuation bank-grade, n8n Pazotti.
