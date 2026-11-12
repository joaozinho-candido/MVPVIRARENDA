import Link from "next/link";
import Image from "next/image";
import { mentor } from "@/lib/mentors";

export function Logo({ dark = false, href = "/" }: { dark?: boolean; href?: string }) {
  return (
    <Link href={href} className="font-display text-xl font-extrabold tracking-tight" aria-label="Vira Renda, página inicial">
      <span className={dark ? "text-[#5BE09A]" : "text-vira"}>vira</span>{" "}
      <span className={dark ? "text-white" : "text-noite"}>renda</span>
    </Link>
  );
}

const PHOTOS: Record<string, string> = { Bia: "bia", Caio: "caio", Duda: "duda", Lia: "lia", Nando: "nando", Rosa: "rosa" };

export function MentorAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const m = mentor(name);
  const px = { sm: 32, md: 40, lg: 56, xl: 88 }[size];
  const s = { sm: "h-8 w-8 text-sm", md: "h-10 w-10 text-base", lg: "h-14 w-14 text-xl", xl: "h-[88px] w-[88px] text-3xl" }[size];
  const photo = PHOTOS[name];
  if (photo)
    return (
      <Image
        src={`/mentores/${photo}.jpg`}
        alt=""
        aria-hidden
        width={px}
        height={px}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white ${s} ${m.bg}`}
      />
    );
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold ${s} ${m.bg} ${m.fg}`}>
      {name[0]}
    </span>
  );
}

/** Balão do mentor. Mentores são IA e isso aparece sempre na tela. */
export function MentorBubble({ name, children, className = "" }: { name: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <MentorAvatar name={name} />
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-white p-4 shadow-sm ring-1 ring-tinta/5">
        <p className="mb-1 text-xs font-semibold text-tinta-soft">
          {name} · mentor{name === "Bia" || name === "Duda" || name === "Lia" || name === "Rosa" ? "a" : ""} (IA)
        </p>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-bold text-noite sm:text-3xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  green: "bg-vira-light text-vira-dark",
  yellow: "bg-sol-light text-[#7A5A00]",
  coral: "bg-festa-light text-festa-dark",
  gray: "bg-areia-dark text-tinta-soft",
  dark: "bg-noite text-white",
};

export function Pill({ tone = "gray", children }: { tone?: keyof typeof STATUS_STYLE; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[tone]}`}>{children}</span>;
}

export function Notice({ tone = "yellow", children, className = "" }: { tone?: "yellow" | "green" | "coral" | "gray"; children: React.ReactNode; className?: string }) {
  const s = { yellow: "bg-sol-light border-sol/40", green: "bg-vira-light border-vira/20", coral: "bg-festa-light border-festa/30", gray: "bg-white border-tinta/10" }[tone];
  return <div role="status" className={`rounded-2xl border px-4 py-3 text-[15px] ${s} ${className}`}>{children}</div>;
}

export function Stat({ label, value, tone = "white" }: { label: string; value: React.ReactNode; tone?: "white" | "yellow" | "green" | "coral" }) {
  const s = { white: "bg-white", yellow: "bg-sol-light", green: "bg-vira-light", coral: "bg-festa-light" }[tone];
  return (
    <div className={`rounded-2xl p-4 ${s}`}>
      <p className="text-sm text-tinta-soft">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-noite">{value}</p>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-tinta/20 bg-white/60 p-6 text-center">
      <p className="font-display text-lg font-semibold text-noite">{title}</p>
      {children && <div className="mt-2 text-tinta-soft">{children}</div>}
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  error,
  autoComplete,
  inputMode,
  hint,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  placeholder?: string;
  required?: boolean;
  error?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  hint?: string;
  maxLength?: number;
}) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`field ${error ? "border-festa" : ""}`}
      />
      {hint && !error && <p className="mt-1.5 text-sm text-tinta-soft">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="help">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormMessage({ state }: { state?: { ok: boolean; error?: string; message?: string } | null }) {
  if (!state) return null;
  if (!state.ok && state.error)
    return (
      <p role="alert" className="rounded-xl bg-festa-light px-4 py-3 text-sm text-festa-dark">
        {state.error}
      </p>
    );
  if (state.ok && state.message)
    return (
      <p role="status" className="rounded-xl bg-vira-light px-4 py-3 text-sm text-vira-dark">
        ✓ {state.message}
      </p>
    );
  return null;
}

export function DifficultyDots({ value }: { value: number }) {
  return (
    <span aria-label={`Dificuldade ${["", "baixa", "média", "alta"][value]}`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= value ? "text-noite" : "text-tinta/20"}>
          ●
        </span>
      ))}{" "}
      {["", "Baixa", "Média", "Alta"][value]}
    </span>
  );
}
