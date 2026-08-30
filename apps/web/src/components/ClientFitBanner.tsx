import type { SalesQualification } from "@orbe/shared";
import { OperateActionButton } from "@/components/OperateActionButton";

const VERDICT: Record<
  "ideal" | "problema" | "neutro",
  { title: string; hint: string; className: string }
> = {
  ideal: {
    title: "Cliente ideal",
    hint: "Paga, aplica, gera resultado e indicacao. A reuniao mostrou alinhamento com o metodo.",
    className: "border-emerald-300 bg-emerald-50 text-emerald-950",
  },
  problema: {
    title: "Cliente problema",
    hint: "Drena energia, trava crescimento e contamina agenda. A reuniao mostrou sinais de alerta.",
    className: "border-red-300 bg-red-50 text-red-950",
  },
  neutro: {
    title: "Ainda indefinido",
    hint: "A reuniao nao deu evidencia suficiente nos cinco eixos. Nao invento fit.",
    className: "border-amber-300 bg-amber-50 text-amber-950",
  },
};

export function ClientFitBanner({
  clientId,
  sessionId,
  qualification,
  hasTranscript,
}: {
  clientId: string;
  sessionId?: string;
  qualification?: SalesQualification | null;
  hasTranscript: boolean;
}) {
  const suggested = qualification?.suggestedLabel ?? qualification?.scoreLabel;
  const tone = suggested ? VERDICT[suggested] : null;
  const reasons = qualification?.suggestedReasons ?? [];
  const decision = qualification?.decision;

  return (
    <section className={`mb-6 rounded-3xl border-2 px-5 py-5 ${tone?.className ?? "border-slate-200 bg-white text-[#012245]"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
        Leitura da reuniao estrategica
      </p>
      <h2 className="mt-1 text-2xl font-semibold">{tone?.title ?? "Ainda sem leitura de fit"}</h2>
      <p className="mt-2 max-w-3xl text-sm opacity-90">
        {tone?.hint ??
          "Grave ou cole a reuniao. O sistema le a memoria das sessoes (todas as conversas juntas) e sugere se e cliente ideal ou problema. Voce decide admitir."}
      </p>
      {reasons.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      {decision === "admitir" || decision === "nao_admitir" ? (
        <p className="mt-3 text-sm font-semibold">
          Sua decisao: {decision === "admitir" ? "admitir" : "nao admitir"}.
        </p>
      ) : (
        <p className="mt-3 text-sm opacity-80">Voce ainda nao decidiu. O sistema so sugere.</p>
      )}
      {hasTranscript ? (
        <div className="mt-4 max-w-xs">
          <OperateActionButton
            clientId={clientId}
            sessionId={sessionId}
            action="sugerir_fit"
            variant="secondary"
            label={suggested ? "Ler a reuniao de novo" : "Ler a reuniao e sugerir fit"}
            pendingLabel="Lendo a reuniao..."
          />
        </div>
      ) : null}
    </section>
  );
}
