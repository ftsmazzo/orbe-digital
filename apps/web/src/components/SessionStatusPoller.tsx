"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Recarrega a pagina enquanto a sessao espera STT/callback. */
export function SessionStatusPoller({ status }: { status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (status !== "processando") return;
    const id = window.setInterval(() => {
      router.refresh();
    }, 4000);
    return () => window.clearInterval(id);
  }, [status, router]);

  if (status !== "processando") return null;

  return (
    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Transcricao em andamento… esta tela atualiza sozinha a cada poucos segundos.
    </p>
  );
}
