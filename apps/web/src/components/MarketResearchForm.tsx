"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";

type Props = {
  clientId: string;
  defaultRegion?: string;
  defaultSector?: string;
};

export function MarketResearchForm({ clientId, defaultRegion = "", defaultSector = "" }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("Buscando com Tavily / OpenRouter…");
    setPending(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/clients/${clientId}/market-research`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scope: formData.get("scope"),
          region: formData.get("region"),
          sector: formData.get("sector"),
          website: formData.get("website"),
          applyIndicators: false,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(String(payload.error || `Falha (${response.status}).`));
        setStatus("");
        return;
      }

      setStatus("Pesquisa gravada com fontes.");
      router.refresh();
    } catch {
      setError("Falha de rede. Tente de novo.");
      setStatus("");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <Field label="Alcance">
        <Select name="scope" defaultValue="regional" disabled={pending}>
          <option value="regional">Regional</option>
          <option value="global">Amplo</option>
        </Select>
      </Field>
      <Field label="Regiao / mercado">
        <Input name="region" defaultValue={defaultRegion} placeholder="Cidade ou UF" disabled={pending} />
      </Field>
      <Field label="Setor">
        <Input name="sector" defaultValue={defaultSector} placeholder="Ex.: TI / servicos" disabled={pending} />
      </Field>
      {status ? <p className="text-sm text-[#2e7271]">{status}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Pesquisando…" : "Rodar pesquisa"}
      </Button>
    </form>
  );
}
