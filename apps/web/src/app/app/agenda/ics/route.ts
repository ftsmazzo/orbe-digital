import { buildOrgCalendarIcs, icsResponse } from "@/lib/agenda/ics";
import { dayKey } from "@/lib/agenda/calendar";
import { getCurrentOrg } from "@/lib/org";

export async function GET() {
  const { orgId, orgName } = await getCurrentOrg();
  const body = await buildOrgCalendarIcs(orgId, orgName);
  return icsResponse(body, "download", `orbe-agenda-${dayKey(new Date())}.ics`);
}
