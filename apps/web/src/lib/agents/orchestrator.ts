import { OPERATE_STEP_LABELS, type OperateStep } from "@orbe/shared";

export type OperateSnapshot = {
  hasReadySession: boolean;
  hasTranscript: boolean;
  hasDocument: boolean;
  hasDiagnostic: boolean;
  diagnosticValidated: boolean;
  hasGoals: boolean;
  hasProposal: boolean;
};

export type OperatePlan = {
  current: OperateStep;
  label: string;
  nextAction: OperateStep | null;
  nextLabel: string | null;
  hint: string;
};

export function planOperate(state: OperateSnapshot): OperatePlan {
  if (!state.hasTranscript && !state.hasDocument && !state.hasReadySession) {
    return step("capturar", null, "Grave a sessao ou envie um documento. A IA so preenche o que isso sustentar.");
  }
  if (!state.hasDiagnostic) {
    return step(
      "diagnosticar",
      "diagnosticar",
      "Ha materia-prima (transcricao ou documento). Clique para extrair a ficha O.",
    );
  }
  if (!state.diagnosticValidated) {
    return step("validar", "validar", "Revise gaps e prioridades. Validar trava a versao e libera o plano.");
  }
  if (!state.hasGoals) {
    return step("planejar", "planejar", "Diagnostico validado. Gerar rascunho de metas, KPIs e planos de acao.");
  }
  if (!state.hasProposal) {
    return step("propor", "propor", "Plano no nucleo. Gerar proposta com marca DH para o Daniel revisar.");
  }
  return step("acompanhar", null, "Ciclo em andamento. Use gestao para dashboard, acoes e honorarios.");
}

function step(current: OperateStep, nextAction: OperateStep | null, hint: string): OperatePlan {
  return {
    current,
    label: OPERATE_STEP_LABELS[current],
    nextAction,
    nextLabel: nextAction ? OPERATE_STEP_LABELS[nextAction] : null,
    hint,
  };
}
