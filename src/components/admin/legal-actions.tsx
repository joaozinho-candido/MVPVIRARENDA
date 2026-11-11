"use client";
import { useState, useTransition } from "react";
import { transitionLegalAction } from "@/app/actions/admin";
import type { LegalAction } from "@/server/legal";

export function LegalButtons({ id, status, role }: { id: string; status: string; role: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [comment, setComment] = useState("");
  const run = (a: LegalAction) =>
    start(async () => {
      const r = await transitionLegalAction(id, a, comment);
      setMsg(r.ok ? "✓ Feito" : r.error);
      if (r.ok) setComment("");
    });
  const editor = role === "admin" || role === "editor";
  const reviewer = role === "reviewer";
  return (
    <div className="space-y-3">
      {reviewer && status === "in_review" && (
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className="field py-2" placeholder="Comentário (obrigatório para devolver)" aria-label="Comentário do revisor" />
      )}
      <div className="flex flex-wrap gap-2">
        {editor && ["draft", "outdated"].includes(status) && <button className="btn-primary btn-sm" disabled={pending} onClick={() => run("submit")}>Enviar para revisão</button>}
        {reviewer && status === "in_review" && (
          <>
            <button className="btn-secondary btn-sm" disabled={pending} onClick={() => run("return")}>Devolver com comentário</button>
            <button className="btn-primary btn-sm" disabled={pending} onClick={() => run("approve")}>Aprovar</button>
          </>
        )}
        {editor && status === "approved" && <button className="btn-primary btn-sm" disabled={pending} onClick={() => run("publish")}>Publicar</button>}
        {(editor || reviewer) && ["published", "approved"].includes(status) && <button className="btn-secondary btn-sm" disabled={pending} onClick={() => run("outdate")}>Marcar desatualizado</button>}
      </div>
      {msg && <p className="text-sm" role="status">{msg}</p>}
      <p className="text-xs text-tinta-soft">Só o papel Revisor aprova. Publicar exige estar aprovado.</p>
    </div>
  );
}
