import Link from "next/link";
import {
  ACTION_STATUS_LABELS,
  ACTION_STATUSES,
  PERSPECTIVE_LABELS_DANIEL,
  type ActionStatus,
  type Perspective,
} from "@orbe/shared";
import { EmptyNote, Select } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { updateActionStatus } from "@/app/app/actions";

type ActionRow = {
  id: string;
  title: string;
  how?: string | null;
  ownerName?: string | null;
  dueDate?: Date | string | null;
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

export function ActionWorkboard({
  clientId,
  actions,
  vista,
}: {
  clientId: string;
  actions: ActionRow[];
  vista: "lista" | "quadro";
}) {
  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap gap-2">
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

      {vista === "lista" ? (
        <div className="overflow-x-auto rounded-3xl border border-[#012245]/10 bg-white">
          <table className="w-full min-w-[760px] table-fixed text-left text-sm">
            <thead className="bg-[#f7f4ee] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[38%] px-4 py-3 font-semibold">Acao</th>
                <th className="w-[14%] px-4 py-3 font-semibold">Perspectiva</th>
                <th className="w-[14%] px-4 py-3 font-semibold">Quem</th>
                <th className="w-[12%] px-4 py-3 font-semibold">Prazo</th>
                <th className="w-[22%] px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-slate-500">
                    Nenhuma acao ainda. O ciclo preenche o 5W2H.
                  </td>
                </tr>
              ) : (
                actions.map((action) => (
                  <tr key={action.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3">
                      <p className="line-clamp-2 font-semibold text-[#012245]">{action.title}</p>
                      {action.how ? <p className="mt-1 line-clamp-1 text-xs text-slate-500">{action.how}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{perspectiveLabel(action.perspective) || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{action.ownerName ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(action.dueDate)}</td>
                    <td className="px-4 py-3">
                      <StatusMove actionId={action.id} clientId={clientId} status={action.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                        action.status === "atrasado" ? "border-red-200 bg-red-50" : "border-slate-100 bg-[#f7f4ee]/60"
                      }`}
                    >
                      <p className="line-clamp-2 text-sm font-semibold text-[#012245]">{action.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {action.ownerName ?? "Sem responsavel"}
                        {perspectiveLabel(action.perspective) ? ` · ${perspectiveLabel(action.perspective)}` : ""}
                        {` · prazo ${formatDate(action.dueDate)}`}
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
