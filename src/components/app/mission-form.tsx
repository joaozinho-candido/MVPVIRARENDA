"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDraftAction, completeMissionAction } from "@/app/actions/journey";
import { Celebration } from "./celebration";
import type { MissionField } from "@/db/schema";

type Props = {
  missionId: string;
  stageNumber: number;
  fields: MissionField[];
  checklist: string[];
  initialAnswers: Record<string, string>;
  initialChecks: boolean[];
  completed: boolean;
  sound: boolean;
};

export function MissionForm({ missionId, stageNumber, fields, checklist, initialAnswers, initialChecks, completed, sound }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [checks, setChecks] = useState<boolean[]>(checklist.map((_, i) => !!initialChecks[i]));
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [celebrate, setCelebrate] = useState<null | { points: number; lines: string[]; next: { id: string; title: string } | null }>(null);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  // Salva sozinho a cada campo (com pequena espera para não salvar a cada letra)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const r = await saveDraftAction(missionId, answers, checks);
      setSaved(r.ok ? "saved" : "error");
      if (!r.ok) setError(r.error);
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [answers, checks, missionId]);

  const missing = [...fields.filter((f) => f.required && !(answers[f.key] ?? "").trim()).map((f) => f.label), ...checklist.filter((_, i) => !checks[i])];

  return (
    <div className="space-y-5">
      {fields.map((f) => (
        <div key={f.key}>
          <label htmlFor={`m-${f.key}`} className="label">
            {f.label} {!f.required && <span className="font-normal text-tinta-soft">(opcional)</span>}
          </label>
          {f.type === "textarea" ? (
            <textarea id={`m-${f.key}`} rows={4} className="field py-3" placeholder={f.placeholder} value={answers[f.key] ?? ""} onChange={(e) => setAnswers({ ...answers, [f.key]: e.target.value })} />
          ) : f.type === "select" ? (
            <select id={`m-${f.key}`} className="field" value={answers[f.key] ?? ""} onChange={(e) => setAnswers({ ...answers, [f.key]: e.target.value })}>
              <option value="">Escolha…</option>
              {f.options?.map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input
              id={`m-${f.key}`}
              className="field"
              placeholder={f.placeholder}
              inputMode={f.type === "number" ? "decimal" : undefined}
              value={answers[f.key] ?? ""}
              onChange={(e) => setAnswers({ ...answers, [f.key]: f.type === "number" ? e.target.value.replace(/[^\d.,]/g, "").replace(",", ".") : e.target.value })}
            />
          )}
        </div>
      ))}
      {checklist.length > 0 && (
        <fieldset className="rounded-2xl bg-areia p-4">
          <legend className="sr-only">Confira</legend>
          <p className="mb-2 text-sm font-semibold">Confira</p>
          {checklist.map((c, i) => (
            <label key={c} className="flex min-h-11 items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-vira" checked={checks[i]} onChange={(e) => setChecks(checks.map((v, j) => (j === i ? e.target.checked : v)))} />
              {c}
            </label>
          ))}
        </fieldset>
      )}
      <p className="text-sm text-tinta-soft" aria-live="polite">
        {saved === "saving" ? "Salvando…" : saved === "saved" ? "✓ Salvo agora" : saved === "error" ? error : completed ? "Missão concluída. Você pode editar: os pontos continuam." : "Salva sozinho a cada campo."}
      </p>
      {error && saved !== "error" && <p className="help">{error}</p>}
      <div className="sticky bottom-20 flex gap-3 rounded-2xl bg-areia/95 py-2 backdrop-blur lg:static lg:bg-transparent">
        {!completed && (
          <button
            type="button"
            className="btn-secondary"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await saveDraftAction(missionId, answers, checks, true);
                router.push("/app/missoes");
              })
            }
          >
            Pausar
          </button>
        )}
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={pending || missing.length > 0}
          onClick={() =>
            start(async () => {
              setError("");
              const r = await completeMissionAction(missionId, answers, checks);
              if (!r.ok) return setError(r.error);
              const res = r.result;
              if (!res.firstTime) {
                router.push("/app/missoes");
                return;
              }
              setCelebrate({
                points: res.points + (res.stageCompleted ? 100 : 0) + res.badges.reduce((s, b) => s + b.points, 0),
                lines: [
                  `Etapa ${res.stageNumber}: ${res.stageDone} de ${res.stageTotal} missões feitas`,
                  ...(res.stageCompleted ? ["🏁 Etapa completa! +100 pontos de marco"] : []),
                  ...res.badges.map((b) => `${b.emoji} Nova conquista: ${b.name}`),
                ],
                next: res.next,
              });
            })
          }
        >
          {completed ? "Salvar alterações" : missing.length ? `Concluir (falta ${missing.length} ${missing.length === 1 ? "item" : "itens"})` : "Concluir missão"}
        </button>
      </div>
      {celebrate && (
        <Celebration
          autoOpen
          sound={sound}
          points={celebrate.points}
          lines={[...celebrate.lines, ...(celebrate.next ? [`Próxima: ${celebrate.next.title}`] : [])]}
          onClose={() => router.push(celebrate.next ? `/app/missoes/${celebrate.next.id}` : `/app/missoes#etapa-${stageNumber}`)}
          next={
            <Link href="/app" className="btn-secondary">
              Ver minha jornada
            </Link>
          }
        />
      )}
    </div>
  );
}
