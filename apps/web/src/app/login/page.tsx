import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main
      className="min-h-dvh bg-[#f3f1ec] px-4 py-8 text-[#012245] md:px-6 md:py-12"
      style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}
    >
      <div className="mx-auto grid max-w-md overflow-hidden rounded-3xl bg-white shadow-xl md:max-w-5xl md:grid-cols-[1fr_420px]">
        <section className="bg-[#012245] p-6 text-white md:p-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-orbe.png" alt="ORBE" className="h-14 w-14 rounded-2xl bg-white object-cover md:h-16 md:w-16" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#c8a04c]">ORBE Digital</p>
          <h1 className="mt-4 text-2xl font-semibold leading-tight md:mt-8 md:text-4xl">
            Da conversa ao plano, no celular e no escritorio.
          </h1>
          <p className="mt-4 hidden max-w-xl text-white/75 md:mt-6 md:block">
            Grave a sessao, acompanhe a agenda e opere o ciclo ORBE.
          </p>
        </section>
        <section className="p-6 md:p-8">
          <h2 className="text-2xl font-semibold">Entrar</h2>
          <p className="mt-2 text-sm text-slate-500">Use o usuario do ambiente.</p>
          <div className="mt-8">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
