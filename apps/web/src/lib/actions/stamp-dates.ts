import { and, desc, eq } from "drizzle-orm";
import { actionItems, db, organizations } from "@/lib/db";
import { replaceQuando, scheduleActionWindow } from "@/lib/actions/schedule";
import { mergeOrgSettings } from "@/lib/sales/playbook";

export async function stampMissingActionDates(orgId: string, clientId?: string, extraHolidays: string[] = []) {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const holidays = [...(mergeOrgSettings(org?.settings).localHolidays ?? []), ...extraHolidays];
  const rows = await db
    .select()
    .from(actionItems)
    .where(
      clientId
        ? and(eq(actionItems.clientId, clientId), eq(actionItems.organizationId, orgId))
        : eq(actionItems.organizationId, orgId),
    )
    .orderBy(desc(actionItems.createdAt));

  const byClient = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byClient.get(row.clientId) ?? [];
    list.push(row);
    byClient.set(row.clientId, list);
  }

  let stamped = 0;
  for (const clientRows of byClient.values()) {
    let index = 0;
    for (const row of clientRows) {
      if (row.dueDate && row.startDate && row.businessDays) continue;
      const window = scheduleActionWindow({
        perspective: row.perspective,
        title: row.title,
        how: row.how,
        hintedDays: row.businessDays,
        index,
        extraHolidays: holidays,
      });
      index += 1;
      stamped += 1;
      await db
        .update(actionItems)
        .set({
          startDate: new Date(`${window.startDate}T12:00:00`),
          dueDate: new Date(`${window.dueDate}T12:00:00`),
          businessDays: window.businessDays,
          how: replaceQuando(row.how, window),
          updatedAt: new Date(),
        })
        .where(eq(actionItems.id, row.id));
    }
  }
  return stamped;
}
