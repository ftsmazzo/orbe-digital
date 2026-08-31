import Link from "next/link";
import { BarChart3, CalendarDays, CirclePlay, ClipboardList, Handshake, LayoutDashboard, Mic2, Settings, Target, Users } from "lucide-react";
import { AppMobileChrome } from "@/components/AppMobileChrome";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentOrg } from "@/lib/org";

const nav = [
  { href: "/app/operate", label: "Operacao", hint: "Dia a dia", icon: CirclePlay },
  { href: "/app/sessions", label: "Gravar", hint: "Dia a dia", icon: Mic2 },
  { href: "/app/agenda", label: "Agenda", hint: "Dia a dia", icon: CalendarDays },
  { href: "/app/clients", label: "Clientes", hint: "Gestao", icon: Users },
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
    <div className="min-h-dvh bg-[#f7f4ee] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col overflow-y-auto bg-[#012245] p-6 text-white lg:flex">
        <Link href="/app/operate" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-orbe.png" alt="ORBE" className="h-14 w-14 rounded-2xl object-cover bg-white/10" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#c8a04c]">Digital</p>
        </Link>
        <nav className="mt-10 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/78 transition hover:bg-white/10 hover:text-white">
                <Icon className="h-4 w-4 shrink-0 text-[#c8a04c]" />
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
          <p className="mt-1 break-all">{session.user.email}</p>
          <LogoutButton />
        </div>
      </aside>

      <div className="lg:pl-72">
        <AppMobileChrome />
        <main className="mx-auto min-w-0 max-w-7xl px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:px-6 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
