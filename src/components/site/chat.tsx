"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MentorAvatar } from "../ui";

type Msg = { from: "mentor" | "me"; text: string } | { from: "result"; title: string; score: number };

const HERO_SCRIPT: Msg[] = [
  { from: "mentor", text: "Oi! O que as pessoas vivem te pedindo ajuda?" },
  { from: "me", text: "Arrumar fotos e vídeos 😅" },
  { from: "mentor", text: "Isso é talento! Achei 3 caminhos para você." },
  { from: "result", title: "Edição de vídeos curtos", score: 92 },
];

/** Conversa da primeira dobra, dentro de um celular. Roda uma vez e fica parada no resultado. */
export function HeroChat() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(HERO_SCRIPT.length);
    if (n >= HERO_SCRIPT.length) return;
    const t = setTimeout(() => setN((v) => v + 1), n === 0 ? 700 : 1700);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div className="mx-auto w-full max-w-[320px]" aria-label="Exemplo de conversa com a mentora Bia">
      <div className="rounded-[2.6rem] bg-noite p-3 shadow-2xl ring-1 ring-white/10">
        <div className="relative overflow-hidden rounded-[2rem] bg-areia">
          <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-noite" aria-hidden />
          <div className="flex items-center gap-3 border-b border-tinta/10 bg-white px-4 py-3">
            <MentorAvatar name="Bia" size="sm" />
            <div className="leading-tight">
              <p className="text-sm font-semibold">Bia · mentora (IA)</p>
              <p className="text-xs text-vira">{n < HERO_SCRIPT.length ? "digitando…" : "online"}</p>
            </div>
          </div>
          <div className="flex min-h-[340px] flex-col gap-2.5 p-4" aria-live="polite">
            {HERO_SCRIPT.slice(0, n).map((m, i) =>
              m.from === "result" ? (
                <div key={i} className="animate-rise rounded-2xl bg-white p-3 shadow-sm ring-2 ring-vira/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-vira">1º caminho</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-semibold text-noite">{m.title}</span>
                    <span className="font-display text-2xl font-extrabold text-vira">{m.score}%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-vira-light"><div className="h-1.5 rounded-full bg-vira" style={{ width: `${m.score}%` }} /></div>
                </div>
              ) : (
                <p
                  key={i}
                  className={`max-w-[85%] animate-rise rounded-2xl px-3.5 py-2 text-[14px] ${m.from === "mentor" ? "self-start rounded-tl-md bg-white shadow-sm" : "self-end rounded-tr-md bg-vira text-white"}`}
                >
                  {m.text}
                </p>
              ),
            )}
            {n < HERO_SCRIPT.length && <TypingDots />}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TypingDots({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex w-14 gap-1 rounded-2xl px-3 py-3 ${light ? "bg-white shadow-sm" : "bg-areia"}`} aria-label="digitando">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-tinta-soft" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

type Day = { day: string; label: string; mentor: string; time: string; msgs: { from: "mentor" | "me"; text: string }[]; result: string; detail: string; savedIn: string };

const WEEK: Day[] = [
  {
    day: "Seg",
    label: "Descobrir talentos",
    mentor: "Bia",
    time: "segunda, 20:10",
    msgs: [
      { from: "mentor", text: "Vamos começar pelo que você já sabe fazer. O que as pessoas te pedem ajuda?" },
      { from: "me", text: "Arrumar as fotos do salão da minha tia e postar no Instagram dela." },
      { from: "mentor", text: "Isso já é um talento! Anotei: fotos, redes sociais e atendimento. Amanhã o Caio te mostra os caminhos." },
    ],
    result: "Fotos, redes sociais e atendimento",
    detail: "Seu retrato de talentos, com tempo, equipamentos e orçamento.",
    savedIn: "Perfil de talentos",
  },
  {
    day: "Ter",
    label: "Escolher o caminho",
    mentor: "Caio",
    time: "terça, 19:30",
    msgs: [
      { from: "mentor", text: "Achei 3 caminhos que cabem em 1 hora por dia e no seu orçamento." },
      { from: "me", text: "Gostei do de vídeos." },
      { from: "mentor", text: "Boa escolha. Atenção: tem concorrência e pede portfólio. Te ajudo nisso." },
    ],
    result: "Edição de vídeos curtos · 92%",
    detail: "Com o porquê da escolha, os riscos e o que você vai precisar.",
    savedIn: "Minhas oportunidades",
  },
  {
    day: "Qua",
    label: "Montar a oferta",
    mentor: "Duda",
    time: "quarta, 19:40",
    msgs: [
      { from: "mentor", text: "Vamos montar sua oferta em 3 frases. Primeiro: o que você entrega?" },
      { from: "me", text: "4 vídeos curtos por mês para o Instagram" },
      { from: "mentor", text: "Ótimo! E para quem? Pensa em quem você já conhece." },
      { from: "me", text: "Salões de beleza do bairro" },
    ],
    result: "“4 vídeos por mês para salões do bairro mostrarem seus trabalhos.”",
    detail: "Sua oferta pronta para usar nos textos de venda.",
    savedIn: "Materiais › Oferta",
  },
  {
    day: "Qui",
    label: "Calcular o preço",
    mentor: "Rosa",
    time: "quinta, 21:00",
    msgs: [
      { from: "mentor", text: "Quanto tempo leva cada vídeo e quanto você gasta para fazer?" },
      { from: "me", text: "Umas 2 horas. App e transporte." },
      { from: "mentor", text: "Fiz a conta com seus custos. Compare com 3 concorrentes antes de fechar." },
    ],
    result: "Preço do pacote calculado",
    detail: "Com seus custos, seu tempo e uma comparação com o mercado.",
    savedIn: "Jornada › Custos e preço",
  },
  {
    day: "Sex",
    label: "Primeiros contatos",
    mentor: "Nando",
    time: "sexta, 18:15",
    msgs: [
      { from: "mentor", text: "A Lia já deixou sua mensagem pronta. Para quem você quer mandar primeiro?" },
      { from: "me", text: "Para o salão da minha tia e mais dois do bairro." },
      { from: "mentor", text: "Coloquei os 3 no seu quadro de clientes, com lembrete para segunda. Quem envia a mensagem é você." },
    ],
    result: "3 contatos no quadro de clientes",
    detail: "Cada um com a mensagem pronta e a próxima ação marcada.",
    savedIn: "Meus clientes",
  },
];

/** Demonstração do início da jornada: clicar num dia troca a conversa. */
export function DemoWeek() {
  const [d, setD] = useState(2);
  const [shown, setShown] = useState(0);
  const day = WEEK[d];
  useEffect(() => {
    setShown(0);
    const id = setInterval(() => setShown((v) => (v > day.msgs.length ? v : v + 1)), 900);
    return () => clearInterval(id);
  }, [d, day.msgs.length]);
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr_300px]">
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" role="tablist" aria-label="Dias da semana">
        {WEEK.map((w, i) => (
          <button
            key={w.day}
            role="tab"
            aria-selected={i === d}
            onClick={() => setD(i)}
            className={`shrink-0 rounded-2xl px-4 py-3 text-left text-sm transition ${i === d ? "bg-noite text-white shadow-md" : "bg-white text-tinta hover:bg-vira-light"}`}
          >
            <span className="font-semibold">{w.day}</span> · {w.label}
          </button>
        ))}
      </div>
      <div className="card min-h-[300px]" role="tabpanel">
        <div className="mb-4 flex items-center gap-3">
          <MentorAvatar name={day.mentor} />
          <p className="text-sm">
            <span className="font-semibold">{day.mentor}</span> <span className="text-tinta-soft">· {day.time}</span>
          </p>
        </div>
        <div className="flex flex-col gap-3" aria-live="polite">
          {day.msgs.slice(0, shown).map((m, i) => (
            <p key={`${d}-${i}`} className={`max-w-[85%] animate-rise rounded-2xl px-4 py-2.5 text-[15px] ${m.from === "mentor" ? "self-start rounded-tl-md bg-areia" : "self-end rounded-tr-md bg-vira text-white"}`}>
              {m.text}
            </p>
          ))}
          {shown < day.msgs.length && <TypingDots />}
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-card bg-noite p-5 text-white">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-sol">✓ Pronto na {day.time.split(",")[0]}</p>
          <span className="text-xs text-white/60">dia {d + 1} de 5</span>
        </div>
        <div className="flex gap-1" aria-hidden>
          {WEEK.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= d ? "bg-sol" : "bg-white/15"}`} />
          ))}
        </div>
        <div key={d} className="animate-rise rounded-2xl bg-white p-4 text-noite">
          <p className="font-display text-lg font-bold leading-snug">{day.result}</p>
          <p className="mt-2 text-sm text-tinta-soft">{day.detail}</p>
        </div>
        <p className="text-sm text-white/75">
          Salvo em <span className="rounded-full bg-white/10 px-2.5 py-1 font-semibold text-white">{day.savedIn}</span>
        </p>
        <Link href="/questionario" className="btn-highlight mt-auto">
          Quero montar a minha
        </Link>
      </div>
    </div>
  );
}
