export const BRAND_ASSETS = {
  dhDark: "/brand/logo-dh.png",
  dhLockup: "/brand/logo-dh-lockup.png",
  dhBanner: "/brand/logo-dh-banner.png",
  orbe: "/brand/logo-orbe.png",
} as const;

export function wrapDhDocument(opts: {
  title: string;
  clientName: string;
  bodyHtml: string;
  extraFooter?: string;
}) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(opts.title)}</title>
  <style>
    @page { margin: 18mm 16mm 22mm; }
    body { font-family: "Times New Roman", Times, Georgia, serif; color: #012245; font-size: 12pt; line-height: 1.5; text-align: justify; }
    header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #012245; padding-bottom: 12px; margin-bottom: 20px; }
    header img { height: 64px; }
    header .meta { font-size: 11px; color: #2e7271; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    h2 { font-size: 13px; color: #2e7271; margin: 18px 0 6px; }
    .gold { color: #c8a04c; }
    footer.sign { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; page-break-inside: avoid; }
    .sign-box { border-top: 1px solid #012245; padding-top: 8px; min-height: 72px; }
    .printbar { position: sticky; top: 0; background: #f7f4ee; padding: 8px; display: flex; gap: 8px; }
    @media print { .printbar { display: none; } }
  </style>
</head>
<body>
  <div class="printbar">
    <button onclick="window.print()">Imprimir / salvar PDF</button>
  </div>
  <header>
    <img src="${BRAND_ASSETS.dhDark}" alt="Daniel Herculis"/>
    <div>
      <strong>Daniel Herculis Assessoria e Consultoria Financeira e Estrategica</strong>
      <div class="meta">CNPJ 64.860.330/0001-30 · Catanduva - SP · daniel@danielherculis.com.br</div>
      <div class="meta">${escapeHtml(opts.title)} · ${escapeHtml(opts.clientName)}</div>
    </div>
  </header>
  ${opts.bodyHtml}
  <footer class="sign">
    <div class="sign-box">
      <p>Reconhecimento do cliente</p>
      <p>Nome: ${escapeHtml(opts.clientName)}</p>
      <p>Data: ____/____/________ &nbsp; Assinatura: _______________________</p>
    </div>
    <div class="sign-box">
      <p>Daniel Berigo Herculis</p>
      <p>Contratada</p>
      <p>Data: ____/____/________ &nbsp; Assinatura: _______________________</p>
    </div>
  </footer>
  ${opts.extraFooter ?? ""}
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
