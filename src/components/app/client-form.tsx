"use client";
import { useActionState } from "react";
import { saveClientAction } from "@/app/actions/work";
import { FormMessage } from "../ui";

type C = { id?: string; name?: string; contactName?: string; phone?: string; channel?: string; origin?: string; status?: string; firstContactAt?: string | null; notes?: string; nextAction?: string; nextActionAt?: string; reminderOn?: boolean };

export function ClientForm({ client, statuses }: { client?: C; statuses: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState(saveClientAction, null);
  const c = client ?? {};
  return (
    <form action={action} className="card grid gap-4 sm:grid-cols-2">
      {c.id && <input type="hidden" name="id" value={c.id} />}
      <div className="sm:col-span-2">
        <label className="label" htmlFor="c-name">Cliente (pessoa ou negócio)</label>
        <input id="c-name" name="name" required defaultValue={c.name} className="field" placeholder="Ex.: Salão Aurora" />
      </div>
      <div>
        <label className="label" htmlFor="c-contact">Pessoa de contato</label>
        <input id="c-contact" name="contactName" defaultValue={c.contactName} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="c-phone">Telefone / WhatsApp</label>
        <input id="c-phone" name="phone" inputMode="tel" defaultValue={c.phone} className="field" placeholder="(11) 90000-0000" />
      </div>
      <div>
        <label className="label" htmlFor="c-origin">Origem</label>
        <select id="c-origin" name="origin" defaultValue={c.origin ?? "Indicação"} className="field">
          {["Indicação", "Instagram", "WhatsApp", "Feira do bairro", "Grupo do bairro", "Visita", "Outro"].map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="c-status">Status</label>
        <select id="c-status" name="status" defaultValue={c.status ?? "novo"} className="field">
          {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="c-first">Primeiro contato</label>
        <input id="c-first" type="date" name="firstContactAt" defaultValue={c.firstContactAt ?? ""} className="field" />
      </div>
      <input type="hidden" name="channel" value={c.channel ?? "WhatsApp"} />
      <div className="sm:col-span-2 grid gap-4 rounded-2xl bg-areia p-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-next">Próxima ação</label>
          <input id="c-next" name="nextAction" defaultValue={c.nextAction} className="field" placeholder="Ex.: Perguntar o que achou dos vídeos" />
        </div>
        <div>
          <label className="label" htmlFor="c-when">Quando</label>
          <input id="c-when" type="datetime-local" name="nextActionAt" defaultValue={c.nextActionAt ?? ""} className="field" />
        </div>
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <input type="checkbox" name="reminderOn" defaultChecked={c.reminderOn ?? true} className="h-5 w-5 accent-vira" />
          🔔 Lembrete dentro da plataforma
        </label>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="c-notes">Observações</label>
        <textarea id="c-notes" name="notes" rows={3} defaultValue={c.notes} className="field py-3" />
      </div>
      <div className="sm:col-span-2"><FormMessage state={state} /></div>
      <button className="btn-primary sm:col-span-2 sm:w-fit" disabled={pending}>{pending ? "Salvando…" : "Salvar cliente"}</button>
    </form>
  );
}
