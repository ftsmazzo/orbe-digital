import { OPERATE_STEP_LABELS, type OperateStep } from "@orbe/shared";

export type OperateSnapshot = {
  hasReadySession: boolean;
  hasTranscript: boolean;
  hasDocument: boolean;
  hasDiagnostic: boolean;
  diagnosticThin: boolean;
  diagnosticValidated: boolean;
  goals: number;
  actions: number;
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
    return step("capturar", null, "Grave a sessao, oriente ou envie um documento. O sistema opera o metodo.");
  }
  const incomplete =
    !state.hasDiagnostic || state.diagnosticThin || state.goals < 4 || state.actions === 0 || !state.hasProposal;
  if (incomplete) {
    return step("ciclo", "ciclo", "O orquestrador preenche diagnostico, BSC, acoes e proposta. Voce so valida e acompanha.");
  }
  if (!state.diagnosticValidated) {
    return step("validar", "validar", "Ciclo preenchido. Validar trava a qualidade do servico.");
  }
  return step("acompanhar", null, "Acompanhe o desenvolvimento. Grave de novo ou direcione quando algo mudar.");
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
