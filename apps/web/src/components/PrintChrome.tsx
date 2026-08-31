"use client";

import { BRAND } from "@orbe/shared";

export function PrintChrome({
  title,
  clientName,
  children,
}: {
  title: string;
  clientName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[210mm] bg-white p-8 font-serif text-[12pt] leading-[1.5] text-[#012245] print:max-w-none print:p-0">
      <div className="mb-4 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-[#012245] px-4 py-2 text-sm font-semibold text-white"
        >
          Imprimir / salvar PDF
        </button>
      </div>
      <header className="mb-6 flex items-center gap-4 border-b-[3px] border-[#012245] pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-dh.png" alt="Daniel Herculis" className="h-14" />
        <div>
          <p className="font-semibold">{BRAND.legalName}</p>
          <p className="text-xs text-[#2e7271]">
            CNPJ {BRAND.cnpj} · {BRAND.city}
          </p>
          <p className="text-xs">
            {title} · {clientName}
          </p>
        </div>
      </header>
      {children}
      <footer className="mt-10 grid grid-cols-2 gap-8 text-sm">
        <div className="border-t border-[#012245] pt-3">
          <p>Reconhecimento do cliente</p>
          <p>{clientName}</p>
          <p className="mt-6">Data ____/____/________ Assinatura _______________</p>
        </div>
        <div className="border-t border-[#012245] pt-3">
          <p>Daniel Berigo Herculis</p>
          <p>Contratada</p>
          <p className="mt-6">Data ____/____/________ Assinatura _______________</p>
        </div>
      </footer>
    </div>
  );
}
