import Link from "next/link";
import { APPOINTMENT_KIND_LABELS, type AppointmentKind } from "@orbe/shared";
import { Button, EmptyNote, Field, Input, Select, Textarea } from "@/components/ui";
import { createAppointment, deleteAppointment } from "@/app/app/actions";
import {
  addDaysKey,
  formatAgendaDay,
  formatAgendaTime,
  monthCells,
  monthLabel,
  monthQuery,
  shiftMonth,
  todayKey,
  weekDays,
  type AgendaEvent,
} from "@/lib/agenda/calendar";

const KIND_TONE: Record<AgendaEvent["kind"], string> = {
  prazo: "bg-[#012245] text-white",
  reuniao: "bg-[#c8a04c] text-[#012245]",
  lembrete: "bg-[#2e7271] text-white",
};

function EventChip({ event }: { event: AgendaEvent }) {
  const inner = (
    <span className={`block truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${KIND_TONE[event.kind]} ${event.overdue ? "ring-1 ring-red-500" : ""}`}>
      {event.kind === "prazo" ? "Prazo" : event.kind === "reuniao" ? "Reunião" : "Lembrete"} · {event.title}
    </span>
  );
  if (!event.href) return inner;
  return (
    <Link href={event.href} className="block min-w-0">
      {inner}
    </Link>
  );
}

export function AgendaMonth({
  year,
  month,
  byDay,
}: {
  year: number;
  month: number;
  byDay: Map<string, AgendaEvent[]>;
}) {
  const today = todayKey();
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const cells = monthCells(year, month);

  return (
    <section className="min-w-0 rounded-3xl border border-[#012245]/10 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={`/app/agenda?mes=${monthQuery(prev.year, prev.month)}`}
          className="rounded-full px-3 py-1 text-sm font-semibold text-[#012245] hover:bg-[#f7f4ee]"
        >
          ‹
        </Link>
        <h2 className="text-lg font-semibold capitalize text-[#012245]">{monthLabel(year, month)}</h2>
        <Link
          href={`/app/agenda?mes=${monthQuery(next.year, next.month)}`}
          className="rounded-full px-3 py-1 text-sm font-semibold text-[#012245] hover:bg-[#f7f4ee]"
        >
          ›
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {weekDays().map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((key, index) => {
          if (!key) return <div key={`empty-${index}`} className="min-h-24 rounded-2xl bg-[#f7f4ee]/40" />;
          const events = byDay.get(key) ?? [];
          const isToday = key === today;
          return (
            <div
              key={key}
              className={`min-h-24 rounded-2xl border p-1.5 ${
                isToday ? "border-[#c8a04c] bg-[#c8a04c]/10" : "border-transparent bg-[#f7f4ee]/70"
              }`}
            >
              <p className={`text-xs font-semibold ${isToday ? "text-[#c8a04c]" : "text-[#012245]"}`}>
                {Number(key.slice(-2))}
              </p>
              {events.length ? (
                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-[#c8a04c] md:hidden" />
              ) : null}
              <div className="mt-1 hidden space-y-1 md:block">
                {events.slice(0, 3).map((event) => (
                  <EventChip key={event.id} event={event} />
                ))}
                {events.length > 3 ? (
                  <p className="text-[10px] font-semibold text-slate-500">+{events.length - 3}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AgendaAgenda({ byDay }: { byDay: Map<string, AgendaEvent[]> }) {
  const today = todayKey();
  const keys = Array.from({ length: 8 }, (_, index) => addDaysKey(today, index));
  const overdue = [...byDay.values()]
    .flat()
    .filter((event) => event.overdue)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <div className="space-y-4">
      {overdue.length ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700">Atrasado</p>
          <ul className="mt-3 space-y-2">
            {overdue.slice(0, 6).map((event) => (
              <li key={event.id}>
                <EventLine event={event} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {keys.map((key) => {
        const events = byDay.get(key) ?? [];
        if (!events.length && key !== today) return null;
        return (
          <section key={key} className="rounded-3xl border border-[#012245]/10 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">
              {key === today ? "Hoje" : formatAgendaDay(key)}
            </p>
            {events.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">Livre</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {events.map((event) => (
                  <li key={event.id}>
                    <EventLine event={event} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function EventLine({ event }: { event: AgendaEvent }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {event.href ? (
          <Link href={event.href} className="font-semibold text-[#012245] hover:underline">
            {event.title}
          </Link>
        ) : (
          <p className="font-semibold text-[#012245]">{event.title}</p>
        )}
        <p className="mt-0.5 text-xs text-slate-500">
          {event.kind === "prazo" ? "Prazo" : APPOINTMENT_KIND_LABELS[event.kind as AppointmentKind]}
          {event.kind !== "prazo" ? ` · ${formatAgendaTime(event.at)}` : ""}
          {event.clientName ? ` · ${event.clientName}` : ""}
        </p>
      </div>
      {event.appointmentId ? (
        <form action={deleteAppointment.bind(null, event.appointmentId)}>
          <button type="submit" className="text-xs font-semibold text-slate-400 hover:text-red-700">
            Tirar
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function AgendaCreateForm({
  clients,
  defaultDate,
}: {
  clients: { id: string; name: string }[];
  defaultDate: string;
}) {
  return (
    <section className="rounded-3xl border border-[#012245]/10 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">Marcar</p>
      <h2 className="mt-1 text-lg font-semibold text-[#012245]">Reunião ou lembrete</h2>
      {clients.length === 0 ? (
        <EmptyNote>Crie um cliente no CRM antes de marcar reunião.</EmptyNote>
      ) : (
        <form action={createAppointment} className="mt-4 grid gap-3">
          <Field label="Tipo">
            <Select name="kind" defaultValue="reuniao">
              <option value="reuniao">Reunião</option>
              <option value="lembrete">Lembrete</option>
            </Select>
          </Field>
          <Field label="Cliente">
            <Select name="clientId">
              <option value="">Sem cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="O que é">
            <Input name="title" required placeholder="Sessão de diagnóstico, ligar, revisar prazo..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dia">
              <Input name="date" type="date" required defaultValue={defaultDate} />
            </Field>
            <Field label="Hora">
              <Input name="time" type="time" required defaultValue="09:00" />
            </Field>
          </div>
          <Field label="Duração">
            <Select name="duration" defaultValue="60">
              <option value="30">30 min</option>
              <option value="60">1 hora</option>
              <option value="90">1h30</option>
              <option value="120">2 horas</option>
            </Select>
          </Field>
          <Field label="Nota">
            <Textarea name="notes" rows={2} placeholder="Opcional" />
          </Field>
          <Button>Agendar</Button>
        </form>
      )}
    </section>
  );
}
