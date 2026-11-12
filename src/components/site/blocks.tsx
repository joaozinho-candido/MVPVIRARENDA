"use client";
import { useState } from "react";
import { MENTORS, MENTOR_ORDER } from "@/lib/mentors";
import { MentorAvatar } from "../ui";

export type OppCard = {
  slug: string;
  title: string;
  buyers: string;
  description: string;
  risks: string;
  mode: "online" | "presencial" | "ambos";
  phoneOnly: boolean;
  investmentLevel: "baixo" | "medio" | "alto";
  requiredEquipment: string[];
};

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "online", label: "Online" },
  { key: "presencial", label: "Presencial" },
  { key: "phone", label: "Só com celular" },
  { key: "cheap", label: "Pouco investimento" },
];

function tagLine(o: OppCard) {
  const mode = o.mode === "ambos" ? "Online ou presencial" : o.mode === "online" ? "Online" : "Presencial";
  const eq = o.phoneOnly ? "celular" : o.requiredEquipment.includes("computador") ? "computador" : o.requiredEquipment.length ? "equipamento próprio" : "pouco equipamento";
  const inv = { baixo: "investimento baixo", medio: "investimento médio", alto: "investimento alto" }[o.investmentLevel];
  return `${mode} · ${eq} · ${inv}`;
}

export function OpportunityExamples({ items }: { items: OppCard[] }) {
  const [f, setF] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const shown = items.filter((o) =>
    f === "all" ? true : f === "online" ? o.mode !== "presencial" : f === "presencial" ? o.mode !== "online" : f === "phone" ? o.phoneOnly : o.investmentLevel === "baixo",
  );
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar oportunidades">
        {FILTERS.map((x) => (
          <button key={x.key} onClick={() => setF(x.key)} aria-pressed={f === x.key} className={`chip ${f === x.key ? "!border-noite !bg-noite !text-white" : ""}`}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((o) => (
          <button key={o.slug} onClick={() => setOpen(open === o.slug ? null : o.slug)} aria-expanded={open === o.slug} className="rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-tinta/5 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-vira/40">
            <p className="font-semibold text-noite">{o.title}</p>
            <p className="mt-1 text-sm text-tinta-soft">Quem compra: {o.buyers}</p>
            <p className={`mt-1 text-sm font-semibold ${o.mode === "presencial" ? "text-festa-dark" : "text-vira"}`}>{tagLine(o)}</p>
            {open === o.slug && (
              <div className="mt-3 animate-rise border-t border-tinta/10 pt-3 text-sm">
                <p>{o.description}</p>
                <p className="mt-2 rounded-xl bg-festa-light px-3 py-2 text-festa-dark">
                  <b>Riscos e limites:</b> {o.risks}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MentorsGrid() {
  const [sel, setSel] = useState<string>("Bia");
  const m = MENTORS[sel as keyof typeof MENTORS];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3">
        {MENTOR_ORDER.map((k) => (
          <button key={k} onClick={() => setSel(k)} aria-pressed={sel === k} className={`flex flex-col items-center gap-2 rounded-2xl p-3 transition ${sel === k ? "bg-white shadow-md ring-2 ring-vira" : "bg-white/50 hover:bg-white"}`}>
            <MentorAvatar name={k} size="xl" />
            <span className="text-sm font-semibold">{k}</span>
          </button>
        ))}
      </div>
      <div className="rounded-card bg-noite p-6 text-white" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-sol">{sel} · {m.role}</p>
        <p className="mt-3 font-display text-xl font-semibold">“{m.quote}”</p>
        <p className="mt-3 leading-relaxed text-white/80">{m.does}</p>
      </div>
    </div>
  );
}
