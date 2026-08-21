"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const result = await authClient.signIn.email({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    setLoading(false);

    if (result.error) {
      setError("E-mail ou senha invalidos.");
      return;
    }

    router.push(searchParams.get("redirect") || "/app/clients");
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">E-mail</span>
        <input
          name="email"
          type="email"
          defaultValue="daniel@danielherculis.com.br"
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#2e7271]"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Senha</span>
        <input
          name="password"
          type="password"
          defaultValue="orbe-demo-2026"
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#2e7271]"
          required
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#012245] px-4 py-3 font-semibold text-white transition hover:bg-[#02315f] disabled:opacity-60"
      >
        {loading ? "Entrando..." : "Entrar no ORBE Digital"}
      </button>
    </form>
  );
}
