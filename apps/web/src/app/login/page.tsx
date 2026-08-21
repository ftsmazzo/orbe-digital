import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f3f1ec] px-6 py-12 text-[#012245]">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-[1fr_420px]">
        <section className="bg-[#012245] p-10 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#c8a04c]">ORBE Digital</p>
          <h1 className="mt-8 text-4xl font-semibold leading-tight">Gestao consultiva da conversa ao plano de execucao.</h1>
          <p className="mt-6 max-w-xl text-white/75">
            Acesse clientes, sessoes gravadas, diagnosticos, indicadores, acoes, relatorios e propostas em um unico fluxo.
          </p>
        </section>
        <section className="p-8">
          <h2 className="text-2xl font-semibold">Entrar</h2>
          <p className="mt-2 text-sm text-slate-500">Use o usuario seed do ambiente local.</p>
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
