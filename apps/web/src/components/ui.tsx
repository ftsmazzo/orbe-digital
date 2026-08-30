import Link from "next/link";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2e7271]">ORBE Digital</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#012245]">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-3xl border border-[#012245]/10 bg-white p-6 ${className}`}>{children}</section>
  );
}

export function CardTitle({
  kicker,
  title,
  hint,
}: {
  kicker?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      {kicker ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2e7271]">{kicker}</p>
      ) : null}
      <h2 className="mt-1 text-lg font-semibold text-[#012245]">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-[#012245]/15 bg-[#f7f4ee] px-4 py-3 text-sm text-slate-600">
      {children}
    </p>
  );
}

export function PageGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid min-w-0 gap-6 lg:grid-cols-12">{children}</div>;
}

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  const classes =
    variant === "primary"
      ? "bg-[#012245] text-white hover:bg-[#02315f]"
      : "border border-[#012245]/15 bg-white text-[#012245] hover:bg-[#f7f4ee]";
  return (
    <button {...props} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${classes} ${props.className ?? ""}`}>
      {children}
    </button>
  );
}

export function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-xl bg-[#012245] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#02315f]">
      {children}
    </Link>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#2e7271] ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#2e7271] ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#2e7271] ${props.className ?? ""}`}
    />
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
