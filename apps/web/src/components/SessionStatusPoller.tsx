"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Recarrega a pagina enquanto a sessao espera STT/callback. */
export function SessionStatusPoller({ status, since }: { status: string; since?: string | Date | null }) {
  const router = useRouter();
  const [elapsedMin, setElapsedMin] = useState(0);

  useEffect(() => {
    if (status !== "processando") return;
    const id = window.setInterval(() => {
      router.refresh();
    }, 4000);
    return () => window.clearInterval(id);
  }, [status, router]);

  useEffect(() => {
    if (status !== "processando" || !since) return;
    function tick() {
      if (!since) return;
      setElapsedMin(Math.floor((Date.now() - new Date(since).getTime()) / 60_000));
    }
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [status, since]);

  if (status !== "processando") return null;

  return (
    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Transcricao em andamento{elapsedMin ? ` ha ${elapsedMin} min` : ""}… esta tela atualiza sozinha.
      {elapsedMin >= 8 ? (
        <span className="mt-1 block font-medium">
          Sessao longa costuma travar o Whisper. Baixe o audio nesta pagina e toque em Reprocessar — nao precisa do n8n.
        </span>
      ) : null}
    </p>
  );
}
