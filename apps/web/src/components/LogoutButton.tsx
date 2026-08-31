"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LogoutButton({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const className = compact
    ? "text-sm font-semibold text-[#c0392b] disabled:opacity-60"
    : light
      ? "mt-3 w-full rounded-xl border border-[#012245]/15 bg-[#f7f4ee] px-3 py-2 text-sm font-semibold text-[#012245] disabled:opacity-60"
      : "mt-3 w-full rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 disabled:opacity-60";

  return (
    <button type="button" onClick={onClick} disabled={pending} className={className}>
      {pending ? "Saindo..." : "Sair"}
    </button>
  );
}
