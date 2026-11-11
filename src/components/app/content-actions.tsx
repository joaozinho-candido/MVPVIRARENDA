"use client";
import { useState, useTransition } from "react";
import { advanceChallengeAction, markReadAction } from "@/app/actions/work";
import { Celebration } from "./celebration";

export function ChallengeProgress({ id, count, goal, sound }: { id: string; count: number; goal: number; sound: boolean }) {
  const [c, setC] = useState(count);
  const [done, setDone] = useState<null | number>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <div className="flex gap-1.5">
        {Array.from({ length: goal }).map((_, i) => (
          <span key={i} className={`h-2.5 flex-1 rounded-full ${i < c ? "bg-sol" : "bg-white/20"}`} />
        ))}
      </div>
      <p className="mt-2 text-sm">{c} de {goal} feitas</p>
      <button
        className="btn-highlight btn-sm mt-3"
        disabled={pending || c >= goal}
        onClick={() =>
          start(async () => {
            const r = await advanceChallengeAction(id);
            if (r.ok) {
              setC(r.count);
              if (r.completed && r.points) setDone(r.points);
            }
          })
        }
      >
        +1 feito
      </button>
      {done != null && <Celebration autoOpen title="Desafio concluído!" points={done} sound={sound} />}
    </div>
  );
}

export function MarkRead({ id, read }: { id: string; read: boolean }) {
  const [pending, start] = useTransition();
  if (read) return <span className="text-sm font-semibold text-vira">Lido ✓</span>;
  return (
    <button className="btn-secondary btn-sm" disabled={pending} onClick={() => start(() => markReadAction(id))}>
      Marcar como lido
    </button>
  );
}
