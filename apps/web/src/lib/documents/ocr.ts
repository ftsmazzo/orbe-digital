export type OcrResult = {
  text: string;
  source: "mistral" | "texto" | "heuristic";
  pages: number;
  error?: string;
};

export function hasMistralKey() {
  return Boolean(process.env.MISTRAL_API_KEY?.trim());
}

function ocrModel() {
  return process.env.MISTRAL_OCR_MODEL?.trim() || "mistral-ocr-latest";
}

function dataUrl(mime: string, bytes: Buffer) {
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

function pagesToText(pages: unknown): string {
  if (!Array.isArray(pages)) return "";
  return pages
    .map((page) => {
      if (!page || typeof page !== "object") return "";
      const markdown = (page as { markdown?: unknown }).markdown;
      return typeof markdown === "string" ? markdown.trim() : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

/** Texto nativo (.txt/.md) ou OCR Mistral para PDF/imagem. Sem chave, devolve aviso. */
export async function extractDocumentText(opts: {
  filename: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<OcrResult> {
  const mime = opts.mimeType || "application/octet-stream";
  const isText =
    mime.startsWith("text/") ||
    opts.filename.toLowerCase().endsWith(".md") ||
    opts.filename.toLowerCase().endsWith(".txt");

  if (isText) {
    return { text: opts.bytes.toString("utf8").trim(), source: "texto", pages: 1 };
  }

  if (!hasMistralKey()) {
    return {
      text: "",
      source: "heuristic",
      pages: 0,
      error: "MISTRAL_API_KEY ausente. Cole o texto do documento ou configure a chave no EasyPanel.",
    };
  }

  const isImage = mime.startsWith("image/");
  const document = isImage
    ? { type: "image_url", image_url: dataUrl(mime, opts.bytes) }
    : { type: "document_url", document_url: dataUrl(mime.includes("pdf") ? "application/pdf" : mime, opts.bytes) };

  const response = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY!.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ocrModel(),
      document,
      table_format: "markdown",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      text: "",
      source: "mistral",
      pages: 0,
      error: `Mistral OCR ${response.status}: ${detail.slice(0, 280)}`,
    };
  }

  const json = (await response.json()) as { pages?: unknown };
  const text = pagesToText(json.pages);
  return {
    text,
    source: "mistral",
    pages: Array.isArray(json.pages) ? json.pages.length : 0,
  };
}
