import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#012245] px-6 py-12 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#c8a04c]">ORBE Digital</p>
        <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">
          Consultoria com diagnostico, plano e execucao em um so lugar.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/75">
          Plataforma para conduzir sessoes, extrair diagnosticos ORBE, organizar metas, acompanhar indicadores e gerar relatorios e propostas.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/login" className="rounded-full bg-[#c8a04c] px-6 py-3 font-semibold text-[#012245]">
            Acessar app
          </Link>
          <a href="/orbe-cliente.html" className="rounded-full border border-white/25 px-6 py-3 font-semibold text-white">
            Ver pagina do cliente
          </a>
        </div>
      </section>
    </main>
  );
}
