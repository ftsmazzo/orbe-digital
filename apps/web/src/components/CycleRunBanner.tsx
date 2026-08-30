"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export type CycleRunState = {
  status: "idle" | "running" | "done" | "error";
  step?: string;
  error?: string;
  apify?: string;
  startedAt?: string;
};

export function CycleRunBanner({ cycleRun }: { cycleRun?: CycleRunState | null }) {
  const router = useRouter();
  const running = cycleRun?.status === "running";

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [running, router]);

  if (!cycleRun || cycleRun.status === "idle") return null;

  if (cycleRun.status === "running") {
    return (
      <p className="mt-3 max-w-xl text-sm text-[#2e7271]">
        Ciclo em andamento: {cycleRun.step ?? "processando"}. Pode mudar de pagina — ao voltar, o estado continua
        aqui.
      </p>
    );
  }

  if (cycleRun.status === "error") {
    return <p className="mt-3 max-w-xl text-sm text-red-700">{cycleRun.error}</p>;
  }

  return (
    <p className="mt-3 max-w-xl text-sm text-slate-600">
      Ultimo ciclo concluido.
      {cycleRun.apify ? ` Pesquisa R: ${cycleRun.apify}.` : ""}
    </p>
  );
}
