"use client";
import { useState } from "react";
import type { MissionField } from "@/db/schema";

export function FieldsEditor({ initial }: { initial: MissionField[] }) {
  const [fields, setFields] = useState<MissionField[]>(initial);
  const up = (i: number, patch: Partial<MissionField>) => setFields(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  return (
    <div>
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={i} className="grid gap-2 rounded-xl bg-areia p-3 sm:grid-cols-[120px_1fr_130px_auto_auto]">
            <input aria-label="Chave" value={f.key} onChange={(e) => up(i, { key: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase() })} className="field" placeholder="chave" />
            <input aria-label="Pergunta" value={f.label} onChange={(e) => up(i, { label: e.target.value })} className="field" placeholder="Texto do campo" />
            <select aria-label="Tipo" value={f.type} onChange={(e) => up(i, { type: e.target.value as MissionField["type"] })} className="field">
              <option value="text">Texto curto</option>
              <option value="textarea">Texto longo</option>
              <option value="number">Número</option>
              <option value="select">Escolha</option>
            </select>
            <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={f.required} onChange={(e) => up(i, { required: e.target.checked })} className="h-4 w-4 accent-vira" /> obrigatório</label>
            <button type="button" aria-label="Remover campo" className="text-festa-dark" onClick={() => setFields(fields.filter((_, j) => j !== i))}>✕</button>
            {f.type === "select" && (
              <input aria-label="Opções" value={(f.options ?? []).join(", ")} onChange={(e) => up(i, { options: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} className="field sm:col-span-5" placeholder="Opções separadas por vírgula" />
            )}
          </div>
        ))}
      </div>
      <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => setFields([...fields, { key: `campo_${fields.length + 1}`, label: "", type: "text", required: true }])}>
        + Campo
      </button>
    </div>
  );
}
