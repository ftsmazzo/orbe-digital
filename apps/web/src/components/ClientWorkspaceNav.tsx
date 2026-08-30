import Link from "next/link";

const TABS = [
  { suffix: "operate", label: "Operar" },
  { suffix: "", label: "Cadastro" },
  { suffix: "planning", label: "Planejamento" },
  { suffix: "actions", label: "Acoes" },
  { suffix: "dashboard", label: "Dashboard" },
  { suffix: "proposals", label: "Propostas" },
] as const;

export function ClientWorkspaceNav({ clientId, current }: { clientId: string; current: string }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-[#012245]/10 pb-4">
      {TABS.map((tab) => {
        const href = tab.suffix ? `/app/clients/${clientId}/${tab.suffix}` : `/app/clients/${clientId}`;
        const active = current === tab.suffix;
        return (
          <Link
            key={tab.label}
            href={href}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              active ? "bg-[#012245] text-white" : "bg-white text-[#012245] ring-1 ring-[#012245]/10 hover:bg-[#f7f4ee]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
