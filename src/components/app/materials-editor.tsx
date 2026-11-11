"use client";
import { useState, useTransition } from "react";
import { previewMaterialAction, saveMaterialAction } from "@/app/actions/work";
import { MentorAvatar } from "../ui";
import type { MaterialKind, Tone } from "@/db/schema";

type Saved = { kind: MaterialKind; tone: Tone; variant: number; content: string; edited: boolean };

export function MaterialsEditor({
  kinds,
  tones,
  saved,
  initial,
  initialKind,
}: {
  kinds: { kind: MaterialKind; label: string }[];
  tones: { value: Tone; label: string }[];
  saved: Saved[];
  initial: string;
  initialKind: MaterialKind;
}) {
  const [kind, setKind] = useState<MaterialKind>(initialKind);
  const [savedMap, setSavedMap] = useState(new Map(saved.map((s) => [s.kind, s])));
  const s0 = savedMap.get(initialKind);
  const [tone, setTone] = useState<Tone>(s0?.tone ?? "simpatico");
  const [variant, setVariant] = useState(s0?.variant ?? 0);
  const [text, setText] = useState(s0?.content ?? initial);
  const [edited, setEdited] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const regenerate = (k: MaterialKind, t: Tone, v: number) =>
    start(async () => {
      setText(await previewMaterialAction(k, t, v));
      setEdited(false);
      setMsg("");
    });

  const pick = (k: MaterialKind) => {
    setKind(k);
    const s = savedMap.get(k);
    if (s) {
      setTone(s.tone);
      setVariant(s.variant);
      setText(s.content);
      setEdited(false);
      setMsg("");
    } else {
      setVariant(0);
      regenerate(k, tone, 0);
    }
  };

  const label = kinds.find((k) => k.kind === kind)!.label;
  const isWhats = kind === "whatsapp";

  return (
    <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Meus materiais">
        {kinds.map((k) => (
          <button key={k.kind} onClick={() => pick(k.kind)} aria-current={k.kind === kind} className={`shrink-0 rounded-xl px-4 py-3 text-left text-[15px] ${k.kind === kind ? "bg-noite text-white" : "bg-white"}`}>
            {k.label} {savedMap.has(k.kind) && <span className={k.kind === kind ? "text-sol" : "text-vira"}>✓</span>}
          </button>
        ))}
      </nav>
      <div className="space-y-4">
        <div className="card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <MentorAvatar name="Lia" size="sm" />
              <span>
                <b>Lia (IA)</b> escreveu com base na sua oferta
              </span>
            </div>
            <div className="flex gap-1 rounded-full bg-areia p-1" role="group" aria-label="Tom">
              {tones.map((t) => (
                <button
                  key={t.value}
                  aria-pressed={tone === t.value}
                  onClick={() => {
                    setTone(t.value);
                    regenerate(kind, t.value, variant);
                  }}
                  className={`min-h-9 rounded-full px-3 text-sm font-medium ${tone === t.value ? "bg-white shadow-sm" : "text-tinta-soft"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <label htmlFor="mat-text" className="sr-only">{label}</label>
          <textarea
            id="mat-text"
            rows={10}
            className="field py-3 font-sans leading-relaxed"
            value={text}
            disabled={pending}
            onChange={(e) => {
              setText(e.target.value);
              setEdited(true);
            }}
          />
          <p className="mt-2 text-xs text-tinta-soft">Trechos entre [colchetes] faltam completar: termine as missões da jornada ou edite aqui. Nesta versão, os textos vêm de modelos prontos preenchidos com suas respostas.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="btn-primary btn-sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await saveMaterialAction(kind, tone, variant, text, edited);
                  if (!r.ok) return setMsg(r.error);
                  setSavedMap(new Map(savedMap).set(kind, { kind, tone, variant, content: text, edited }));
                  setMsg("✓ Salvo em Meus materiais");
                })
              }
            >
              Salvar
            </button>
            <button className="btn-secondary btn-sm" onClick={async () => { await navigator.clipboard?.writeText(text).catch(() => {}); setMsg("✓ Copiado"); }}>
              Copiar
            </button>
            <button
              className="btn-secondary btn-sm"
              onClick={() => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
                a.download = `${label}.txt`;
                a.click();
              }}
            >
              Baixar
            </button>
            <button
              className="btn-secondary btn-sm"
              disabled={pending}
              onClick={() => {
                const v = variant + 1;
                setVariant(v);
                regenerate(kind, tone, v);
              }}
            >
              Gerar outra versão
            </button>
          </div>
          {msg && <p className="mt-3 text-sm" role="status">{msg}</p>}
        </div>
        {isWhats && (
          <div className="rounded-card bg-[#E7F5EC] p-5">
            <p className="eyebrow mb-3">Prévia no WhatsApp</p>
            <div className="max-w-sm whitespace-pre-line rounded-2xl rounded-tr-md bg-[#D9FDD3] p-3 text-[15px] shadow-sm">{text} <span className="text-xs text-vira">✓✓</span></div>
            <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm mt-4">
              Abrir no WhatsApp
            </a>
            <p className="mt-2 text-sm text-tinta-soft">O botão abre o WhatsApp com o texto pronto. Quem envia é você.</p>
          </div>
        )}
      </div>
    </div>
  );
}
