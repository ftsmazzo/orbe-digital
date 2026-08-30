import Link from "next/link";
import { BarChart3, CirclePlay, ClipboardList, Handshake, LayoutDashboard, Mic2, Settings, Target, Users } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentOrg } from "@/lib/org";

const nav = [
  { href: "/app/operate", label: "Operacao", hint: "Dia a dia", icon: CirclePlay },
  { href: "/app/clients", label: "Clientes", hint: "Gestao", icon: Users },
  { href: "/app/sessions", label: "Sessoes", hint: "Gestao", icon: Mic2 },
  { href: "/app/diagnostics", label: "Diagnosticos", hint: "Gestao", icon: ClipboardList },
  { href: "/app/planning", label: "Planejamento", hint: "Gestao", icon: Target },
  { href: "/app/actions", label: "Acoes", hint: "Gestao", icon: LayoutDashboard },
  { href: "/app/dashboard", label: "Dashboard", hint: "Gestao", icon: BarChart3 },
  { href: "/app/proposals", label: "Propostas", hint: "Gestao", icon: Handshake },
  { href: "/app/settings", label: "Config", hint: "Gestao", icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { orgName, session } = await getCurrentOrg();

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col bg-[#012245] p-6 text-white lg:flex">
        <Link href="/app/operate" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-orbe.png" alt="ORBE" className="h-14 w-14 rounded-2xl object-cover bg-white/10" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#c8a04c]">Digital</p>
        </Link>
        <nav className="mt-10 space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/78 transition hover:bg-white/10 hover:text-white">
                <Icon className="h-4 w-4 text-[#c8a04c]" />
                <span>
                  {item.label}
                  <span className="block text-[10px] font-normal uppercase tracking-wider text-white/40">{item.hint}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
          <p className="font-semibold text-white">{orgName}</p>
          <p className="mt-1">{session.user.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-[#012245]/10 bg-[#f7f4ee]/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/app/operate" className="font-semibold text-[#012245]">
              ORBE Digital
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/app/operate" className="font-semibold text-[#012245]">
                Operacao
              </Link>
              <Link href="/app/sessions" className="font-semibold text-[#c0392b]">
                Gravador
              </Link>
              <LogoutButton compact />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
