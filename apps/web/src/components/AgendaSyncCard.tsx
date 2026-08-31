"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function AgendaSyncCard({ httpsUrl, webcalUrl }: { httpsUrl: string; webcalUrl: string }) {
  const [copied, setCopied] = useState<"google" | "iphone" | null>(null);

  async function copy(which: "google" | "iphone") {
    const value = which === "google" ? httpsUrl : webcalUrl;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copie o link de sincronizacao:", value);
    }
  }

  return (
    <section className="rounded-3xl border border-[#012245]/10 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">Sincronizar</p>
      <h2 className="mt-1 text-lg font-semibold text-[#012245]">iPhone e Google Agenda</h2>
      <p className="mt-2 text-sm text-slate-500">
        Assinatura viva: prazo, reunião e lembrete entram sozinhos. Não é o arquivo baixado — aquele não atualiza.
      </p>

      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl bg-[#f7f4ee] p-3">
          <p className="text-sm font-semibold text-[#012245]">iPhone</p>
          <p className="mt-1 text-xs text-slate-500">
            Toque em abrir. No Calendário, confirme a assinatura. Ou: Ajustes → Apps → Calendário → Contas → Adicionar conta
            assinada.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={webcalUrl}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#012245] px-4 py-2 text-sm font-semibold text-white"
            >
              Abrir no Calendário
            </a>
            <Button type="button" variant="secondary" onClick={() => copy("iphone")}>
              {copied === "iphone" ? "Copiado" : "Copiar link"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-[#f7f4ee] p-3">
          <p className="text-sm font-semibold text-[#012245]">Google Agenda</p>
          <p className="mt-1 text-xs text-slate-500">
            No computador: outros calendários → + → da URL. Cole o link HTTPS. O Google atualiza sozinho (às vezes leva
            algumas horas na primeira vez).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-xl bg-[#012245] px-4 py-2 text-sm font-semibold text-white"
            >
              Abrir Google Agenda
            </a>
            <Button type="button" variant="secondary" onClick={() => copy("google")}>
              {copied === "google" ? "Copiado" : "Copiar URL"}
            </Button>
          </div>
        </div>

        <a href="/app/agenda/ics" className="text-xs font-semibold text-[#2e7271] underline">
          Só baixar o arquivo .ics (não sincroniza)
        </a>
      </div>
    </section>
  );
}
