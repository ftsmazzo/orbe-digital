"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runOperateAction } from "@/app/app/operate-actions";
import { Button } from "@/components/ui";

export function OperateActionButton({
  clientId,
  action,
  label,
  variant = "primary",
  locked = false,
  pendingLabel,
}: {
  clientId: string;
  action: string;
  label: string;
  variant?: "primary" | "secondary";
  locked?: boolean;
  pendingLabel?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setPending(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("action", action);
      const result = await runOperateAction(clientId, formData);
      if (result?.error) setError(result.error);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao executar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button type="button" variant={variant} onClick={onClick} disabled={pending || locked}>
        {locked ? "Ciclo em andamento..." : pending ? pendingLabel ?? "Processando..." : label}
      </Button>
      {error ? <p className="max-w-md text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
