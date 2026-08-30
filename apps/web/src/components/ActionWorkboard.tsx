import Link from "next/link";
import {
  ACTION_STATUS_LABELS,
  ACTION_STATUSES,
  PERSPECTIVE_LABELS_DANIEL,
  type ActionStatus,
  type Perspective,
} from "@orbe/shared";
import { EmptyNote, Input, Select } from "@/components/ui";
import { toDateInput } from "@/lib/actions/schedule";
import { isActionOverdue } from "@/lib/actions/pulse";
import { formatDate } from "@/lib/format";
import { updateActionSchedule, updateActionStatus } from "@/app/app/actions";

type ActionRow = {
  id: string;
  title: string;
  how?: string | null;
  ownerName?: string | null;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
  businessDays?: number | null;
  status: ActionStatus;
  perspective?: string | null;
  sector?: string | null;
};

const LANES: { id: string; title: string; hint: string; statuses: ActionStatus[] }[] = [
  { id: "fazer", title: "A fazer", hint: "Nao iniciado e aguardando", statuses: ["nao_iniciado", "aguardando"] },
  { id: "curso", title: "Em curso", hint: "Andamento e atrasado", statuses: ["em_andamento", "atrasado"] },
  { id: "feito", title: "Feito", hint: "Concluido", statuses: ["concluido"] },
];

function perspectiveLabel(value?: string | null) {
  if (!value) return "";
  return PERSPECTIVE_LABELS_DANIEL[value as Perspective] ?? value;
}

function Prazo({ action }: { action: ActionRow }) {
  const late = isActionOverdue(action);
  if (!action.dueDate && !action.businessDays) {
    return <span className="text-slate-400">sem prazo</span>;
  }
  return (
    <span className={late ? "text-red-700" : "text-[#012245]"}>
      <strong>{formatDate(action.dueDate)}</strong>
      <span className="mt-0.5 block text-xs text-slate-500">
        {action.businessDays ? `${action.businessDays} du` : "prazo"} · {formatDate(action.startDate)}
      </span>
    </span>
  );
}

function StatusMove({ actionId, clientId, status }: { actionId: string; clientId: string; status: ActionStatus }) {
  return (
    <form action={updateActionStatus.bind(null, actionId, clientId)} className="flex min-w-0 items-center gap-2">
      <Select name="status" defaultValue={status} className="min-w-0">
        {ACTION_STATUSES.map((option) => (
          <option key={option} value={option}>
            {ACTION_STATUS_LABELS[option]}
          </option>
        ))}
      </Select>
      <button className="shrink-0 text-xs font-semibold text-[#2e7271]" type="submit">
        Mover
      </button>
    </form>
  );
}

function ActionCard({ action, clientId }: { action: ActionRow; clientId: string }) {
  const late = isActionOverdue(action);
  return (
    <article className={`rounded-2xl border p-4 ${late ? "border-red-200 bg-red-50" : "border-[#012245]/10 bg-white"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#012245]">{action.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {perspectiveLabel(action.perspective) || "Sem perspectiva"}
            {action.ownerName ? ` · ${action.ownerName}` : " · sem dono"}
          </p>
        </div>
        <div className="text-right text-sm">
          <Prazo action={action} />
        </div>
      </div>
      <div className="mt-3 max-w-sm">
        <StatusMove actionId={action.id} clientId={clientId} status={action.status} />
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-[#2e7271]">Como e prazo</summary>
        {action.how ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{action.how}</p> : null}
        <form action={updateActionSchedule.bind(null, action.id, clientId)} className="mt-3 grid gap-2 sm:grid-cols-3">
          <Input name="startDate" type="date" defaultValue={toDateInput(action.startDate)} />
          <Input name="businessDays" type="number" min={3} max={45} defaultValue={action.businessDays ?? 10} />
          <Input name="dueDate" type="date" defaultValue={toDateInput(action.dueDate)} />
          <button className="text-left text-xs font-semibold text-[#2e7271]" type="submit">
            Salvar prazo
          </button>
        </form>
      </details>
    </article>
  );
}

export function ActionWorkboard({
  clientId,
  actions,
  vista,
}: {
  clientId: string;
  actions: ActionRow[];
  vista: "lista" | "quadro";
}) {
  const open = actions.filter((action) => action.status !== "concluido");
  const late = open.filter(isActionOverdue).length;
  const next = open.find((action) => action.dueDate);

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {open.length} em curso
          {late ? ` · ${late} atrasada${late > 1 ? "s" : ""}` : ""}
          {next ? ` · proxima ${formatDate(next.dueDate)}` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/app/clients/${clientId}/actions`}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              vista === "lista" ? "bg-[#012245] text-white" : "bg-white text-[#012245] ring-1 ring-[#012245]/10"
            }`}
          >
            Lista
          </Link>
          <Link
            href={`/app/clients/${clientId}/actions?vista=quadro`}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              vista === "quadro" ? "bg-[#012245] text-white" : "bg-white text-[#012245] ring-1 ring-[#012245]/10"
            }`}
          >
            Quadro
          </Link>
        </div>
      </div>

      {vista === "lista" ? (
        <div className="grid gap-3">
          {actions.length === 0 ? <EmptyNote>Nenhuma acao ainda. O ciclo preenche o 5W2H com prazo.</EmptyNote> : null}
          {actions.map((action) => (
            <ActionCard key={action.id} action={action} clientId={clientId} />
          ))}
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-3">
          {LANES.map((lane) => {
            const rows = actions.filter((action) => lane.statuses.includes(action.status));
            return (
              <section key={lane.id} className="min-w-0 rounded-3xl border border-[#012245]/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">{lane.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {lane.hint} · {rows.length}
                </p>
                <div className="mt-4 space-y-3">
                  {rows.length === 0 ? <EmptyNote>Vazio</EmptyNote> : null}
                  {rows.map((action) => (
                    <article
                      key={action.id}
                      className={`min-w-0 rounded-2xl border p-3 ${
                        isActionOverdue(action) ? "border-red-200 bg-red-50" : "border-slate-100 bg-[#f7f4ee]/60"
                      }`}
                    >
                      <p className="text-sm font-semibold text-[#012245]">{action.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {action.ownerName ?? "Sem responsavel"}
                        {perspectiveLabel(action.perspective) ? ` · ${perspectiveLabel(action.perspective)}` : ""}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#012245]">
                        {action.businessDays ? `${action.businessDays} du · ` : ""}
                        {formatDate(action.dueDate)}
                      </p>
                      <div className="mt-3">
                        <StatusMove actionId={action.id} clientId={clientId} status={action.status} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
