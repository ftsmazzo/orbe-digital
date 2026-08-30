/** Deixa texto colado ou STT legivel em markdown, sem inventar conteudo. */
export function formatSessionMarkdown(raw: string) {
  let text = raw.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").trim();
  if (!text) return "";

  text = text.replace(/\n{3,}/g, "\n\n");
  const lineCount = (text.match(/\n/g) ?? []).length;
  if (lineCount < 3 && text.length > 280) {
    text = text.replace(/\s+(Cliente|Consultor|Daniel|Entrevistado|Pergunta|Resposta|ORBE)\s*[:\-–]\s*/gi, "\n\n$1: ");
    text = text.replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÃÕÂÊÔÀ0-9])/g, "$1\n\n");
  }

  text = text
    .split("\n")
    .map((line) =>
      line
        .replace(
          /^(?:\*{0,2})(Cliente|Consultor|Daniel|Entrevistado|Pergunta|Resposta|ORBE)(?:\*{0,2})\s*[:\-–]\s*/i,
          "**$1:** ",
        )
        .replace(/^\*\*([^*]+):\*\*\s*\*\*\1:\*\*\s*/i, "**$1:** "),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

export const SESSION_KIND_LABEL: Record<string, string> = {
  estrategica: "Reuniao estrategica",
  followup_fechamento: "Follow-up / fechamento",
  ciclo: "Ciclo ORBE",
};
