import { BRAND } from "@orbe/shared";
import { wrapDhDocument } from "@/lib/brand/document";

export function generateContractHtml(opts: {
  clientName: string;
  clientCnpj?: string;
  clientAddress?: string;
  clientEmail?: string;
  billingStart: "m1" | "m6";
  startLabel?: string;
}) {
  const grace =
    opts.billingStart === "m6"
      ? `No dia 10 do 6o mes de prestacao, a CONTRATANTE realizara o primeiro pagamento correspondente a 15% sobre o EBITDA acumulado desde o inicio da vigencia ate o encerramento do 6o mes. A partir do 7o mes, mensalmente no dia 10, pagara 15% sobre a media mensal do EBITDA apurado nos ultimos 12 meses (ou no periodo existente).`
      : `A partir do 1o mes, no dia 10, a CONTRATANTE pagara 15% sobre o EBITDA do periodo apurado, podendo as partes manter o acerto anual de balanco.`;

  const body = `
    <h1>Contrato de prestacao de servicos de consultoria estrategica</h1>
    <p><strong>CONTRATADA:</strong> ${BRAND.legalName}, CNPJ ${BRAND.cnpj}, ${BRAND.address}.</p>
    <p><strong>CONTRATANTE:</strong> ${escape(opts.clientName)}${opts.clientCnpj ? `, CNPJ ${escape(opts.clientCnpj)}` : ""}.</p>
    <h2>Objeto</h2>
    <p>Prestacao de consultoria estrategica equivalente a implantacao de diretoria: processos, financeiro, RH, marketing, implementacao, acompanhamento e suporte a decisoes. Obrigacao de meio, nao de resultado.</p>
    <h2>Remuneracao</h2>
    <p>${grace}</p>
    <p>EBITDA = Receita liquida − CPV/CSV − despesas operacionais + depreciacao + amortizacao, com base nas demonstracoes da CONTRATANTE (CPC/NBC TG).</p>
    <p>Acerto anual em 31/12: diferenca a pagar em 15 dias ou compensacao no exercicio seguinte.</p>
    <h2>Mora e rescisao</h2>
    <p>Multa 2%, juros 1% a.m., correcao IPCA. Atraso 30 dias: suspensao. 60 dias: rescisao. Aviso previo 60 dias (e-mail). Multa rescisoria 10% da media mensal de EBITDA (12 meses ou periodo existente) se descumprido o aviso.</p>
    <h2>Propriedade intelectual</h2>
    <p>Metodo ORBE, ferramentas e bases de conhecimento permanecem da CONTRATADA. Relatorios do cliente sao de uso interno da CONTRATANTE.</p>
    <h2>Foro</h2>
    <p>Comarca de Catanduva/SP.</p>
    <p>Inicio previsto: ${escape(opts.startLabel ?? "data da assinatura")}.</p>
  `;

  return wrapDhDocument({
    title: "Contrato de consultoria estrategica",
    clientName: opts.clientName,
    bodyHtml: body,
  });
}

function escape(v: string) {
  return v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
