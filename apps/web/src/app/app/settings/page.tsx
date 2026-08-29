import { eq } from "drizzle-orm";
import { Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { db, organizations } from "@/lib/db";
import { DEFAULT_SALES_PLAYBOOK, mergeOrgSettings } from "@/lib/sales/playbook";
import { getCurrentOrg } from "@/lib/org";
import { saveOrgSettings } from "../actions";

export default async function SettingsPage() {
  const { orgId, orgName } = await getCurrentOrg();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const settings = mergeOrgSettings(org?.settings);

  return (
    <>
      <PageHeader
        title="Configuracoes da organizacao"
        description={`${orgName} — playbook comercial, price book e feriados locais.`}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <h2 className="text-lg font-semibold text-[#012245]">Comercial</h2>
          <form action={saveOrgSettings} className="mt-4 grid gap-3">
            <Field label="Meta de faturamento mensal (Daniel)">
              <Input
                name="monthlyRevenueGoal"
                type="number"
                defaultValue={settings.monthlyRevenueGoal ?? 50000}
              />
            </Field>
            <Field label="Price book (JSON)">
              <Textarea
                name="priceBook"
                rows={10}
                defaultValue={JSON.stringify(settings.priceBook, null, 2)}
              />
            </Field>
            <Field label="Feriados locais extras (ISO YYYY-MM-DD, um por linha)">
              <Textarea
                name="localHolidays"
                rows={4}
                defaultValue={(settings.localHolidays ?? []).join("\n")}
              />
            </Field>
            <input type="hidden" name="playbookVersion" value={String(settings.playbookVersion ?? 1)} />
            <Button>Salvar</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-semibold text-[#012245]">Playbook (referencia)</h2>
          <p className="mt-2 text-sm text-slate-600">{DEFAULT_SALES_PLAYBOOK.pricePolicy.principle}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {DEFAULT_SALES_PLAYBOOK.pricePolicy.neverAccept.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            O roteiro completo aparece no checklist do cliente (lead).
          </p>
          <p className="mt-4">
            <a className="text-sm font-semibold text-[#2e7271]" href="/app/settings/knowledge">
              Acervo e fichas de principio
            </a>
          </p>
        </Card>
      </div>
    </>
  );
}
