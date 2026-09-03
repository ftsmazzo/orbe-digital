"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicSttProgress } from "@/lib/sessions/stt-progress";

function elapsedLabel(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min <= 0) return `${sec}s`;
  return `${min} min ${sec.toString().padStart(2, "0")}s`;
}

function displayPercent(progress: PublicSttProgress | null | undefined, now: number) {
  const started = new Date(progress?.startedAt ?? now).getTime();
  const last = new Date(progress?.lastPartAt ?? progress?.startedAt ?? now).getTime();
  const elapsed = Math.max(0, now - started);
  const sincePart = Math.max(0, now - last);

  if (!progress) {
    return Math.min(58, 8 + elapsed / 1800);
  }
  if (progress.phase === "preparando") {
    return Math.min(16, 5 + elapsed / 2200);
  }
  if (progress.phase === "montando") {
    return 96;
  }

  const total = Math.max(progress.total, 1);
  const partShare = 80 / total;
  const base = 14 + progress.done * partShare;
  const estimateMs = progress.chunked ? 120_000 : 80_000;
  const within = Math.min(partShare * 0.9, (sincePart / estimateMs) * partShare);
  return Math.min(94, base + within);
}

function copyFor(progress: PublicSttProgress | null | undefined) {
  if (progress?.phase === "preparando") {
    return {
      title: "Preparando o audio",
      hint: "Sessao longa e quebrada sozinha em partes. O texto final chega completo — sem baixar nem cortar.",
    };
  }
  if (progress?.phase === "montando") {
    return {
      title: "Juntando o texto final",
      hint: "As partes ja foram transcritas. Estamos montando a conversa completa.",
    };
  }
  if (progress?.chunked) {
    return {
      title: `Audio longo — transcrevendo em ${progress.total} partes`,
      hint: "Isso leva um pouco mais do que uma sessao curta. Pode deixar esta tela aberta; ela atualiza sozinha.",
    };
  }
  return {
    title: "Transcrevendo a conversa",
    hint: "Esta tela atualiza sozinha. Em geral leva menos de dois minutos.",
  };
}

export function SessionStatusPoller({
  status,
  since,
  progress,
}: {
  status: string;
  since?: string | Date | null;
  progress?: PublicSttProgress | null;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== "processando") return;
    const id = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(id);
  }, [status, router]);

  useEffect(() => {
    if (status !== "processando") return;
    const id = window.setInterval(() => setNow(Date.now()), 400);
    return () => window.clearInterval(id);
  }, [status, progress?.done, progress?.phase, progress?.startedAt]);

  if (status !== "processando") return null;

  const startedAt = progress?.startedAt ?? since;
  const elapsedMs = startedAt ? now - new Date(startedAt).getTime() : 0;
  const percent = Math.max(4, Math.round(displayPercent(progress, now)));
  const { title, hint } = copyFor(progress);

  return (
    <section className="rounded-3xl border border-[#012245]/10 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">Transcricao</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold text-[#012245]">{title}</h2>
        <p className="shrink-0 text-2xl font-semibold tabular-nums text-[#c8a04c]">{percent}%</p>
      </div>
      <p className="mt-1 text-sm text-slate-600">{hint}</p>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#012245]/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2e7271] to-[#c8a04c] transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
        <p>
          {progress?.chunked
            ? `Parte ${Math.min(progress.done + 1, progress.total)} de ${progress.total}`
            : progress?.phase === "preparando"
              ? "Detectando duracao e tamanho"
              : "Enviado para transcricao"}
        </p>
        <p className="tabular-nums">{elapsedMs > 0 ? elapsedLabel(elapsedMs) : "agora"}</p>
      </div>
    </section>
  );
}
