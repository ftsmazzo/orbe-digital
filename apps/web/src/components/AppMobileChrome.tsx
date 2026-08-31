"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, CirclePlay, Mic2, MoreHorizontal, Users, X } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

const TABS = [
  { href: "/app/operate", label: "Operar", icon: CirclePlay },
  { href: "/app/sessions", label: "Gravar", icon: Mic2 },
  { href: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/app/clients", label: "Clientes", icon: Users },
] as const;

const MORE = [
  { href: "/app/actions", label: "Acoes" },
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/planning", label: "Planejamento" },
  { href: "/app/diagnostics", label: "Diagnosticos" },
  { href: "/app/proposals", label: "Propostas" },
  { href: "/app/settings", label: "Config" },
] as const;

function tabActive(href: string, path: string) {
  if (href === "/app/operate") {
    return path === "/app/operate" || path.includes("/operate");
  }
  if (href === "/app/clients") {
    return path.startsWith("/app/clients") && !path.includes("/operate");
  }
  return path === href || path.startsWith(`${href}/`);
}

export function AppMobileChrome() {
  const path = usePathname() ?? "";
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((item) => path === item.href || path.startsWith(`${item.href}/`));

  useEffect(() => {
    setMoreOpen(false);
  }, [path]);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", moreOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [moreOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#012245] text-white lg:hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex h-12 items-center px-4">
          <Link href="/app/operate" className="text-sm font-semibold tracking-wide">
            ORBE Digital
          </Link>
        </div>
      </header>

      {moreOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-[#012245]/50" aria-label="Fechar menu" onClick={() => setMoreOpen(false)} />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 shadow-2xl"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#012245]">Mais telas</p>
              <button type="button" onClick={() => setMoreOpen(false)} className="rounded-full p-2 text-slate-500" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MORE.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl bg-[#f7f4ee] px-4 py-3 text-sm font-semibold text-[#012245]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <LogoutButton light />
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#012245]/10 bg-white lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tabActive(tab.href, path);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                  active ? "text-[#c8a04c]" : "text-slate-500"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
              moreActive ? "text-[#c8a04c]" : "text-slate-500"
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            Mais
          </button>
        </div>
      </nav>
    </>
  );
}
