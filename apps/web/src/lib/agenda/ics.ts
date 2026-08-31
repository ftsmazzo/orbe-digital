import { eq } from "drizzle-orm";
import { APPOINTMENT_KINDS, type AppointmentKind } from "@orbe/shared";
import { stampMissingActionDates } from "@/lib/actions/stamp-dates";
import { actionItems, appointments, clients, db } from "@/lib/db";

function icsStamp(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function fold(line: string) {
  if (line.length <= 75) return line;
  const chunks = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length) {
    chunks.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return chunks.join("\r\n");
}

export async function buildOrgCalendarIcs(orgId: string, orgName: string) {
  await stampMissingActionDates(orgId);

  const [clientRows, actionRows, appointmentRows] = await Promise.all([
    db.select({ id: clients.id, name: clients.name, tradeName: clients.tradeName }).from(clients).where(eq(clients.organizationId, orgId)),
    db.select().from(actionItems).where(eq(actionItems.organizationId, orgId)),
    db.select().from(appointments).where(eq(appointments.organizationId, orgId)),
  ]);
  const nameById = new Map(clientRows.map((client) => [client.id, client.tradeName ?? client.name]));
  const calName = `ORBE · ${orgName}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//ORBE//${icsEscape(orgName)}//PT`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `NAME:${icsEscape(calName)}`,
    `X-WR-CALNAME:${icsEscape(calName)}`,
    "X-WR-TIMEZONE:America/Sao_Paulo",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const action of actionRows) {
    if (!action.dueDate || action.status === "concluido") continue;
    const start = new Date(action.dueDate);
    const end = new Date(start.getTime() + 60 * 60_000);
    const clientName = nameById.get(action.clientId) ?? "";
    lines.push(
      "BEGIN:VEVENT",
      `UID:prazo-${action.id}@orbe`,
      `DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(end)}`,
      `SUMMARY:${icsEscape(`Prazo · ${action.title}`)}`,
      `DESCRIPTION:${icsEscape([clientName, action.ownerName, action.how].filter(Boolean).join(" — "))}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsEscape(action.title)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }

  for (const row of appointmentRows) {
    const kind: AppointmentKind = APPOINTMENT_KINDS.includes(row.kind as AppointmentKind)
      ? (row.kind as AppointmentKind)
      : "lembrete";
    const start = new Date(row.startsAt);
    const end = row.endsAt ? new Date(row.endsAt) : new Date(start.getTime() + 60 * 60_000);
    const label = kind === "reuniao" ? "Reunião" : "Lembrete";
    const clientName = row.clientId ? nameById.get(row.clientId) ?? "" : "";
    lines.push(
      "BEGIN:VEVENT",
      `UID:agenda-${row.id}@orbe`,
      `DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(end)}`,
      `SUMMARY:${icsEscape(`${label} · ${row.title}`)}`,
      `DESCRIPTION:${icsEscape([clientName, row.notes].filter(Boolean).join(" — "))}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsEscape(row.title)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n");
}

export function icsResponse(body: string, mode: "subscribe" | "download", filename: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `${mode === "download" ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": mode === "subscribe" ? "public, max-age=300" : "private, no-store",
    },
  });
}
