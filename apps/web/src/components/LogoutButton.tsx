"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
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

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={
        compact
          ? "text-sm font-semibold text-[#c0392b] disabled:opacity-60"
          : "mt-3 w-full rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 disabled:opacity-60"
      }
    >
      {pending ? "Saindo..." : "Sair"}
    </button>
  );
}
