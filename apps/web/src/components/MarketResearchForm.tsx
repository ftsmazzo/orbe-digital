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
    setStatus("Iniciando Apify + Claude…");
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
          applyIndicators: formData.get("applyIndicators") === "on",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(String(payload.error || `Falha (${response.status}).`));
        setStatus("");
        return;
      }

      setStatus(
        payload.source === "apify+claude"
          ? "Pesquisa Apify+Claude concluida."
          : "Concluida com fallback heuristico.",
      );
      router.refresh();
    } catch {
      setError("Falha de rede. Tente de novo.");
      setStatus("");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3">
      <Field label="Alcance">
        <Select name="scope" defaultValue="regional" disabled={pending}>
          <option value="regional">Regional (cidade/UF/praca)</option>
          <option value="global">Global / amplo</option>
        </Select>
      </Field>
      <Field label="Regiao / mercado">
        <Input name="region" defaultValue={defaultRegion} placeholder="Ex.: Sao Paulo - SP ou LatAm" disabled={pending} />
      </Field>
      <Field label="Setor">
        <Input name="sector" defaultValue={defaultSector} placeholder="Ex.: Moda / Varejo" disabled={pending} />
      </Field>
      <Field label="Site do cliente (opcional)">
        <Input name="website" placeholder="https://exemplo.com.br" disabled={pending} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input name="applyIndicators" type="checkbox" defaultChecked disabled={pending} />
        Criar indicadores sugeridos automaticamente
      </label>
      <p className="text-xs text-amber-800">
        Apify + Claude: espere 1–2 minutos. O botao trava e mostra progresso.
      </p>
      {status ? <p className="text-sm text-[#2e7271]">{status}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={pending} className={pending ? "opacity-70" : undefined}>
        {pending ? "Pesquisando… nao feche a pagina" : "Rodar pesquisa"}
      </Button>
    </form>
  );
}
