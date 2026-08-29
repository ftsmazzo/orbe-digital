import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { PrintChrome } from "@/components/PrintChrome";
import { PERSPECTIVE_LABELS } from "@orbe/shared";
import { actionItems, clients, db, diagnostics, indicators, proposals, reports, clientContracts } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  const { orgId } = await getCurrentOrg();

  if (kind === "proposal") {
    const [row] = await db.select().from(proposals).where(and(eq(proposals.id, id), eq(proposals.organizationId, orgId))).limit(1);
    if (!row) notFound();
    const [client] = await db.select().from(clients).where(eq(clients.id, row.clientId)).limit(1);
    return (
      <PrintChrome title={row.title} clientName={client?.name ?? ""}>
        <div dangerouslySetInnerHTML={{ __html: stripDoc(row.contentHtml) }} />
      </PrintChrome>
    );
  }
  if (kind === "report") {
    const [row] = await db.select().from(reports).where(and(eq(reports.id, id), eq(reports.organizationId, orgId))).limit(1);
    if (!row) notFound();
    const [client] = await db.select().from(clients).where(eq(clients.id, row.clientId)).limit(1);
    return (
      <PrintChrome title={row.title} clientName={client?.name ?? ""}>
        <div dangerouslySetInnerHTML={{ __html: stripDoc(row.contentHtml) }} />
      </PrintChrome>
    );
  }
  if (kind === "contract") {
    const [row] = await db.select().from(clientContracts).where(and(eq(clientContracts.id, id), eq(clientContracts.organizationId, orgId))).limit(1);
    if (!row) notFound();
    const [client] = await db.select().from(clients).where(eq(clients.id, row.clientId)).limit(1);
    return (
      <PrintChrome title={row.title} clientName={client?.name ?? ""}>
        <div dangerouslySetInnerHTML={{ __html: stripDoc(row.contentHtml) }} />
      </PrintChrome>
    );
  }
  if (kind === "diagnostic") {
    const [row] = await db.select().from(diagnostics).where(and(eq(diagnostics.id, id), eq(diagnostics.organizationId, orgId))).limit(1);
    if (!row) notFound();
    const [client] = await db.select().from(clients).where(eq(clients.id, row.clientId)).limit(1);
    return (
      <PrintChrome title={`Diagnostico v${row.version}`} clientName={client?.name ?? ""}>
        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(row.payload, null, 2)}</pre>
        <h2 className="mt-4 font-semibold">Prioridades</h2>
        <ul>{row.priorities.map((p) => <li key={p}>{p}</li>)}</ul>
      </PrintChrome>
    );
  }
  if (kind === "dashboard") {
    const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
    if (!client) notFound();
    const [indicatorRows, actionRows] = await Promise.all([
      db.select().from(indicators).where(and(eq(indicators.clientId, id), eq(indicators.organizationId, orgId))),
      db.select().from(actionItems).where(and(eq(actionItems.clientId, id), eq(actionItems.organizationId, orgId))),
    ]);
    return (
      <PrintChrome title="Dashboard BSC" clientName={client.name}>
        <ul className="list-disc pl-5 text-sm">
          {indicatorRows.map((i) => (
            <li key={i.id}>
              {i.name} ({PERSPECTIVE_LABELS[i.perspective]})
            </li>
          ))}
        </ul>
        <h2 className="mt-4 font-semibold">Acoes</h2>
        <ul className="list-disc pl-5 text-sm">
          {actionRows.map((a) => (
            <li key={a.id}>
              {a.title} — {a.status}
            </li>
          ))}
        </ul>
      </PrintChrome>
    );
  }
  notFound();
}

function stripDoc(html: string) {
  const article = html.match(/<article[\s\S]*<\/article>/i);
  if (article) return article[0];
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (body) return body[1]!.replace(/<div class="printbar"[\s\S]*?<\/div>/, "").replace(/<header[\s\S]*?<\/header>/, "").replace(/<footer class="sign"[\s\S]*?<\/footer>/, "");
  return html;
}
