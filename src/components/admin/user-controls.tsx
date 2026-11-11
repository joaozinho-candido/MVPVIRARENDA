"use client";
import { useState, useTransition } from "react";
import { setRoleAction, setBlockedAction, adminDeleteUserAction } from "@/app/actions/admin";
import type { Role } from "@/db/schema";

export function RoleSelect({ id, role, self }: { id: string; role: Role; self: boolean }) {
  const [pending, start] = useTransition();
  return (
    <select aria-label="Papel" disabled={pending || self} defaultValue={role} onChange={(e) => start(() => setRoleAction(id, e.target.value as Role))} className="rounded-lg border border-tinta/15 bg-white px-2 py-1 text-sm">
      <option value="user">Usuário</option>
      <option value="editor">Editor</option>
      <option value="reviewer">Revisor</option>
      <option value="admin">Administrador</option>
    </select>
  );
}

export function BlockToggle({ id, blocked, self }: { id: string; blocked: boolean; self: boolean }) {
  const [pending, start] = useTransition();
  if (self) return null;
  return (
    <button className="text-sm underline" disabled={pending} onClick={() => start(() => setBlockedAction(id, !blocked))}>
      {blocked ? "Desbloquear" : "Bloquear"}
    </button>
  );
}

export function AdminDeleteUser({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  if (!open) return <button className="btn-ghost btn-sm text-festa-dark" onClick={() => setOpen(true)}>Excluir conta</button>;
  return (
    <div className="space-y-2 rounded-xl bg-festa-light p-3">
      <p className="text-sm">Só a pedido do titular. Digite o e-mail da conta:</p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="field" aria-label="E-mail para confirmar" />
      {err && <p className="help">{err}</p>}
      <button className="btn-dark btn-sm" disabled={pending} onClick={() => start(async () => { const r = await adminDeleteUserAction(id, email); if (r && !r.ok) setErr(r.error); })}>Excluir definitivamente</button>
    </div>
  );
}
