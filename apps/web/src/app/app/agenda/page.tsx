import { and, desc, eq } from "drizzle-orm";
import { APPOINTMENT_KINDS, type AppointmentKind } from "@orbe/shared";
import { AgendaAgenda, AgendaCreateForm, AgendaMonth } from "@/components/AgendaBoard";
import { AgendaSyncCard } from "@/components/AgendaSyncCard";
import { PageHeader } from "@/components/ui";
import { isActionOverdue } from "@/lib/actions/pulse";
import { stampMissingActionDates } from "@/lib/actions/stamp-dates";
import {
  groupByDay,
  parseYearMonth,
  todayKey,
  type AgendaEvent,
} from "@/lib/agenda/calendar";
import { calendarSubscribeUrls } from "@/lib/agenda/feed-token";
import { actionItems, appointments, clients, db } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const { year, month } = parseYearMonth(mes);
  const { orgId } = await getCurrentOrg();
  await stampMissingActionDates(orgId);
  const subscribe = calendarSubscribeUrls(orgId);

  const [clientRows, actionRows, appointmentRows] = await Promise.all([
    db
      .select({ id: clients.id, name: clients.name, tradeName: clients.tradeName })
      .from(clients)
      .where(eq(clients.organizationId, orgId))
      .orderBy(desc(clients.updatedAt)),
    db.select().from(actionItems).where(and(eq(actionItems.organizationId, orgId))),
    db.select().from(appointments).where(eq(appointments.organizationId, orgId)),
  ]);

  const nameById = new Map(clientRows.map((client) => [client.id, client.tradeName ?? client.name]));

  const events: AgendaEvent[] = [
    ...actionRows
      .filter((action) => action.dueDate && action.status !== "concluido")
      .map((action) => ({
        id: `prazo-${action.id}`,
        kind: "prazo" as const,
        title: action.title,
        clientId: action.clientId,
        clientName: nameById.get(action.clientId),
        href: `/app/clients/${action.clientId}/actions`,
        at: new Date(action.dueDate!),
        overdue: isActionOverdue(action),
      })),
    ...appointmentRows.map((row) => {
      const kind: AppointmentKind = APPOINTMENT_KINDS.includes(row.kind as AppointmentKind)
        ? (row.kind as AppointmentKind)
        : "lembrete";
      return {
        id: row.id,
        kind,
        title: row.title,
        clientId: row.clientId,
        clientName: row.clientId ? nameById.get(row.clientId) : undefined,
        href: row.clientId ? `/app/clients/${row.clientId}/operate` : undefined,
        at: new Date(row.startsAt),
        endsAt: row.endsAt,
        appointmentId: row.id,
      };
    }),
  ];

  const byDay = groupByDay(events);

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Prazos que o ciclo já calculou, reuniões que você marca, lembretes no dia. O CRM continua o funil."
      />

      <div className="mb-5 flex flex-wrap gap-3 text-xs font-semibold">
        <span className="rounded-full bg-[#012245] px-3 py-1 text-white">Prazo da ação</span>
        <span className="rounded-full bg-[#c8a04c] px-3 py-1 text-[#012245]">Reunião</span>
        <span className="rounded-full bg-[#2e7271] px-3 py-1 text-white">Lembrete</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 min-w-0 space-y-4 xl:order-1">
          <AgendaMonth year={year} month={month} byDay={byDay} />
          <AgendaSyncCard httpsUrl={subscribe.httpsUrl} webcalUrl={subscribe.webcalUrl} />
        </div>
        <div className="order-1 space-y-4 xl:order-2">
          <AgendaCreateForm
            defaultDate={todayKey()}
            clients={clientRows.map((client) => ({ id: client.id, name: client.tradeName ?? client.name }))}
          />
          <AgendaAgenda byDay={byDay} />
        </div>
      </div>
    </>
  );
}
