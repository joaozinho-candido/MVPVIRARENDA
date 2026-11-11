export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function brlShort(cents: number): string {
  const v = cents / 100;
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

export function parseBRL(input: string): number | null {
  const clean = input.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  if (!clean) return null;
  const n = Number(clean);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function dateBR(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d.length === 10 ? d + "T12:00:00" : d) : d;
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function dayMonth(d: Date | string | null | undefined): string {
  return dateBR(d).slice(0, 5);
}

export function dateTimeBR(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

/** Data (AAAA-MM-DD) no fuso de São Paulo. */
export function isoDay(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}

export function maskEmail(email: string): string {
  const [u, domain] = email.split("@");
  return `${u.slice(0, 1)}•••@${domain ?? ""}`;
}

export function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
