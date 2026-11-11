"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MentorAvatar } from "../ui";

type Msg = { from: "mentor" | "me"; text: string } | { from: "result"; title: string; score: number };

/** Conversa animada que roda sozinha (primeira dobra). */
export function HeroChat() {
  const script: Msg[] = [
    { from: "mentor", text: "Oi! O que as pessoas vivem te pedindo ajuda?" },
    { from: "me", text: "Arrumar fotos e vídeos 😅" },
    { from: "mentor", text: "Isso é talento! Achei 3 caminhos para você." },
    { from: "result", title: "Edição de vídeos curtos", score: 92 },
  ];
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((v) => (v >= script.length + 2 ? 0 : v + 1)), 1400);
    return () => clearInterval(id);
  }, [script.length]);
  return (
    <div className="card relative mx-auto w-full max-w-md" aria-label="Exemplo de conversa com a mentora Bia">
      <div className="mb-4 flex items-center gap-3">
        <MentorAvatar name="Bia" />
        <div>
          <p className="font-semibold">Bia · mentora (IA)</p>
          <p className="text-xs text-tinta-soft">Exemplo ilustrativo</p>
        </div>
      </div>
      <div className="flex min-h-[230px] flex-col gap-3" aria-live="polite">
        {script.slice(0, Math.min(n, script.length)).map((m, i) =>
          m.from === "result" ? (
            <div key={i} className="flex animate-rise items-center justify-between rounded-2xl bg-vira-light px-4 py-3">
              <span className="font-semibold text-vira-dark">{m.title}</span>
              <span className="font-display text-xl font-bold text-vira">{m.score}%</span>
            </div>
          ) : (
            <p
              key={i}
              className={`max-w-[85%] animate-rise rounded-2xl px-4 py-2.5 text-[15px] ${m.from === "mentor" ? "self-start rounded-tl-md bg-areia" : "self-end rounded-tr-md bg-noite text-white"}`}
            >
              {m.text}
            </p>
          ),
        )}
        {n < script.length && <TypingDots />}
      </div>
    </div>
  );
}

export function TypingDots() {
  return (
    <span className="inline-flex w-14 gap-1 rounded-2xl bg-areia px-3 py-3" aria-label="digitando">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-tinta-soft" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

const WEEK: { day: string; label: string; mentor: string; time: string; msgs: { from: "mentor" | "me"; text: string }[]; result: string; savedIn: string }[] = [
  { day: "Seg", label: "Descobrir talentos", mentor: "Bia", time: "segunda, 20:10", msgs: [{ from: "mentor", text: "O que você faz e nem vê o tempo passar?" }, { from: "me", text: "Mexer no celular, editar foto…" }, { from: "mentor", text: "Anotei: fotos, redes e atendimento. Seu retrato está pronto." }], result: "Talentos: fotos, redes sociais, atendimento", savedIn: "Perfil › Meu retrato" },
  { day: "Ter", label: "Escolher o caminho", mentor: "Caio", time: "terça, 19:30", msgs: [{ from: "mentor", text: "Achei 3 caminhos que cabem em 1 hora por dia." }, { from: "me", text: "Gostei do de vídeos." }, { from: "mentor", text: "Atenção: tem concorrência e pede portfólio. Te ajudo nisso." }], result: "Caminho: Edição de vídeos curtos (92%)", savedIn: "Minhas oportunidades" },
  { day: "Qua", label: "Montar a oferta", mentor: "Duda", time: "quarta, 19:40", msgs: [{ from: "mentor", text: "Vamos montar sua oferta em 3 frases. Primeiro: o que você entrega?" }, { from: "me", text: "4 vídeos curtos por mês para o Instagram" }, { from: "mentor", text: "Ótimo! E para quem? Pensa em quem você já conhece." }, { from: "me", text: "Salões de beleza do bairro" }], result: "“4 vídeos por mês para salões do bairro mostrarem seus trabalhos.”", savedIn: "Materiais › Oferta" },
  { day: "Qui", label: "Calcular o preço", mentor: "Rosa", time: "quinta, 21:00", msgs: [{ from: "mentor", text: "Quanto tempo leva cada vídeo e quanto você gasta?" }, { from: "me", text: "Umas 2 horas. App e transporte." }, { from: "mentor", text: "Fiz a conta com seus custos. Compare com 3 concorrentes antes de fechar." }], result: "Preço por pacote definido com base nos seus custos", savedIn: "Jornada › Custos e preço" },
  { day: "Sex", label: "Primeira mensagem", mentor: "Lia", time: "sexta, 18:15", msgs: [{ from: "mentor", text: "Escrevi sua mensagem de WhatsApp. Quer um tom mais simpático?" }, { from: "me", text: "Quero!" }, { from: "mentor", text: "Pronto. Quem envia é você, quando quiser." }], result: "“Oi! Aqui é a Camila e faço vídeos curtos para salões…”", savedIn: "Materiais › WhatsApp" },
];

/** Demonstração "sua primeira semana": clicar num dia troca a conversa. */
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
    <div className="grid gap-4 lg:grid-cols-[220px_1fr_260px]">
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" role="tablist" aria-label="Dias da semana">
        {WEEK.map((w, i) => (
          <button
            key={w.day}
            role="tab"
            aria-selected={i === d}
            onClick={() => setD(i)}
            className={`shrink-0 rounded-2xl px-4 py-3 text-left text-sm transition ${i === d ? "bg-noite text-white" : "bg-white text-tinta hover:bg-white/70"}`}
          >
            <span className="font-semibold">{w.day}</span> · {w.label}
          </button>
        ))}
      </div>
      <div className="card min-h-[300px]" role="tabpanel">
        <div className="mb-4 flex items-center gap-3">
          <MentorAvatar name={day.mentor} />
          <p className="text-sm">
            <span className="font-semibold">{day.mentor}</span> <span className="text-tinta-soft">(IA) · {day.time}</span>
          </p>
        </div>
        <div className="flex flex-col gap-3" aria-live="polite">
          {day.msgs.slice(0, shown).map((m, i) => (
            <p key={`${d}-${i}`} className={`max-w-[85%] animate-rise rounded-2xl px-4 py-2.5 text-[15px] ${m.from === "mentor" ? "self-start rounded-tl-md bg-areia" : "self-end rounded-tr-md bg-noite text-white"}`}>
              {m.text}
            </p>
          ))}
          {shown < day.msgs.length && <TypingDots />}
        </div>
      </div>
      <div className="flex flex-col justify-between gap-4 rounded-card bg-sol-light p-5">
        <div>
          <p className="eyebrow mb-2 text-[#7A5A00]">Ficou pronto</p>
          <p className="font-display text-lg font-semibold text-noite">{day.result}</p>
          <p className="mt-2 text-sm text-tinta-soft">Salvo em {day.savedIn}</p>
        </div>
        <Link href="/questionario" className="btn-primary">
          Quero montar a minha
        </Link>
      </div>
    </div>
  );
}
