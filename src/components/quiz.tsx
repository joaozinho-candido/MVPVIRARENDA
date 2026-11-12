"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { visibleQuestions, type Question } from "@/lib/quiz";
import type { QuizAnswers } from "@/db/schema";
import { MentorBubble } from "./ui";
import { saveQuizAction, trackQuizStart } from "@/app/actions/journey";

const KEY = "vr_quiz_draft";
type Draft = Partial<Record<string, unknown>>;

export function readQuizDraft(): Draft {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

const BIA_LINES: Record<string, string> = {
  skills: "Vamos começar pelo que você já faz bem. Não precisa ser profissional!",
  interests: "Agora, assuntos que te animam. Isso ajuda a achar algo que você goste de fazer.",
  helpWith: "Uma pista boa de talento: o que as pessoas vivem te pedindo?",
  timeFlies: "Tudo bem não saber. Vamos por outro caminho.",
  experiences: "Suas experiências contam muito. Me conta quais são!",
  period: "Quando sobra um tempinho no seu dia?",
  hoursPerDay: "Seja realista: é melhor pouco tempo todo dia do que muito de vez em quando.",
  equipment: "Agora me mostra o que você já tem em casa. Assim eu só sugiro caminhos que funcionam com o que você usa hoje, sem precisar comprar nada caro.",
  budget: "Quanto dá para investir no começo, sem apertar o orçamento? Muitos caminhos começam com quase nada, então pode marcar “Nada por enquanto” sem medo.",
  mode: "Prefere trabalhar de casa ou sair para atender?",
  salesComfort: "Essa resposta eu passo para a Lia, que escreve suas mensagens e textos de venda. Me conta com sinceridade como você se sente oferecendo seu trabalho, que ela ajusta o tom para você.",
  goal: "Última pergunta! Se quiser, me conta quanto gostaria de ganhar por mês. A Rosa usa isso para planejar seu preço e acompanhar seu progresso com você. É só uma referência, ninguém aqui promete valores.",
};

function toAnswers(d: Draft): QuizAnswers {
  return {
    skills: (d.skills as string[]) ?? [],
    interests: (d.interests as string[]) ?? [],
    helpWith: (d.helpWith as string[]) ?? [],
    timeFlies: (d.timeFlies as string[]) ?? undefined,
    experiences: (d.experiences as string[]) ?? [],
    period: (d.period as string[]) ?? [],
    hoursPerDay: Number(d.hoursPerDay ?? 1),
    equipment: (d.equipment as string[]) ?? [],
    budget: Number(d.budget ?? 0),
    mode: (d.mode as QuizAnswers["mode"]) ?? "tanto_faz",
    salesComfort: (d.salesComfort as QuizAnswers["salesComfort"]) ?? "medio",
    goal: d.goal === "" || d.goal == null ? null : Number(d.goal),
  };
}

export function Quiz({ mode, initial }: { mode: "public" | "app"; initial?: QuizAnswers | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({});
  const [i, setI] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = readQuizDraft();
    const base: Draft = initial ? { ...initial, goal: initial.goal == null ? "" : String(initial.goal), hoursPerDay: String(initial.hoursPerDay), budget: String(initial.budget) } : {};
    setDraft(Object.keys(saved).length && mode === "public" ? saved : base);
    setLoaded(true);
    if (mode === "public" && !Object.keys(saved).length) trackQuizStart().catch(() => {});
  }, [initial, mode]);

  const questions = useMemo(() => visibleQuestions(draft as Partial<QuizAnswers>), [draft]);
  const q: Question = questions[Math.min(i, questions.length - 1)];
  const total = questions.filter((x) => x.id !== "timeFlies").length;
  const position = questions.slice(0, i + 1).filter((x) => x.id !== "timeFlies").length;

  const update = (id: string, value: unknown) => {
    const next = { ...draft, [id]: value };
    setDraft(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next)); // salva a cada resposta
    } catch {}
  };

  const value = draft[q.id];
  const answered = q.kind === "multi" ? true : value !== undefined;
  const isLast = i >= questions.length - 1;

  async function finish() {
    const answers = toAnswers(draft);
    if (mode === "public") {
      localStorage.setItem(KEY, JSON.stringify(draft));
      router.push("/cadastro?resultado=1");
      return;
    }
    setSaving(true);
    const r = await saveQuizAction(answers);
    setSaving(false);
    if (!r.ok) return setError(r.error);
    localStorage.removeItem(KEY);
    router.push(r.chosenStillFits ? "/app/oportunidades?recalculado=1" : "/app/oportunidades?recalculado=1&mudou=1");
    router.refresh();
  }

  if (!loaded) return <div className="h-96" />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm text-tinta-soft">
          <span>{q.id === "timeFlies" ? "Pergunta extra" : `Pergunta ${position} de ${total}`}</span>
          <span>Salvo automaticamente</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-areia-dark" role="progressbar" aria-valuenow={position} aria-valuemin={1} aria-valuemax={total}>
          <div className="h-full rounded-full bg-vira transition-all" style={{ width: `${(position / total) * 100}%` }} />
        </div>
      </div>
      <MentorBubble name="Bia" className="mb-6">
        {BIA_LINES[q.id]}
      </MentorBubble>
      <fieldset key={q.id} className="animate-rise">
        <legend className="font-display text-2xl font-bold text-noite sm:text-3xl">{q.title}</legend>
        {q.hint && <p className="mt-2 text-tinta-soft">{q.hint}</p>}
        <div className={`mt-5 ${q.kind === "multi" ? "flex flex-wrap gap-2" : "grid gap-2"}`}>
          {q.options.map((o) => {
            const multi = q.kind === "multi";
            const arr = (value as string[]) ?? [];
            const on = multi ? arr.includes(o.value) : value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role={multi ? "checkbox" : "radio"}
                aria-checked={on}
                onClick={() => {
                  if (multi) {
                    let next = on ? arr.filter((v) => v !== o.value) : [...arr, o.value];
                    if (o.value === "nao_sei") next = on ? [] : ["nao_sei"];
                    else next = next.filter((v) => v !== "nao_sei");
                    update(q.id, next);
                  } else update(q.id, o.value);
                }}
                className={multi ? `chip ${on ? "chip-on" : ""}` : `flex min-h-14 items-center justify-between rounded-2xl border px-5 text-left text-[15px] font-medium transition ${on ? "border-vira bg-vira-light text-vira-dark" : "border-tinta/15 bg-white hover:border-tinta/30"}`}
              >
                {multi && on && "✓ "}
                {o.label}
                {!multi && on && <span aria-hidden>●</span>}
              </button>
            );
          })}
        </div>
      </fieldset>
      {error && <p className="help mt-4">{error}</p>}
      <div className="mt-8 flex gap-3">
        {i > 0 && (
          <button type="button" className="btn-secondary" onClick={() => setI(i - 1)}>
            Voltar
          </button>
        )}
        <button
          type="button"
          className="btn-primary flex-1 sm:flex-none"
          disabled={!answered || saving}
          onClick={() => (isLast ? finish() : setI(i + 1))}
        >
          {saving ? "Salvando…" : isLast ? (mode === "public" ? "Ver meu resultado" : "Salvar e recalcular") : "Continuar"}
        </button>
      </div>
      {q.kind === "multi" && <p className="mt-3 text-sm text-tinta-soft">Pode continuar sem marcar nada, se nenhuma opção servir.</p>}
    </div>
  );
}
