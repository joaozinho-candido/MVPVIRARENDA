import Link from "next/link";
import { requireRole } from "@/server/session";
import { listUsers } from "@/server/admin";
import { PageTitle, Pill, Notice } from "@/components/ui";
import { RoleSelect, BlockToggle } from "@/components/admin/user-controls";
import { dateBR, maskEmail } from "@/lib/format";

const SUB: Record<string, string> = { active: "Ativa", past_due: "Falhou", paused: "Pausada", canceled: "Cancelada", pending: "Aguardando", expired: "Expirada" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; status?: string; excluido?: string }> }) {
  const me = await requireRole(["admin"]);
  const sp = await searchParams;
  let rows = await listUsers(sp.q ?? "", sp.role);
  if (sp.status) rows = rows.filter((r) => r.sub?.status === sp.status);
  return (
    <div>
      <PageTitle eyebrow="Usuários" title="Assinantes e equipe" />
      {sp.excluido && <Notice tone="green" className="mb-4">Conta excluída e registrada na auditoria.</Notice>}
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="🔍 Nome ou e-mail" className="field max-w-xs" />
        <select name="role" defaultValue={sp.role ?? ""} className="field max-w-[180px]" aria-label="Papel">
          <option value="">Todos os papéis</option>
          <option value="user">Usuários</option>
          <option value="editor">Editores</option>
          <option value="reviewer">Revisores</option>
          <option value="admin">Administradores</option>
        </select>
        <button className="btn-secondary btn-sm">Filtrar</button>
      </form>
      <div className="card table-wrap">
        <table className="tbl">
          <thead><tr><th>Pessoa</th><th>Assinatura</th><th>Cadastro</th><th>Último acesso</th><th>Papel</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/admin/assinantes/${r.id}`} className="link">{r.name}</Link><div className="text-xs text-tinta-soft">{maskEmail(r.email)}{r.status === "blocked" && " · bloqueado"}</div></td>
                <td>{r.sub ? <Pill tone={r.sub.status === "active" ? "green" : r.sub.status === "past_due" ? "yellow" : "gray"}>{SUB[r.sub.status]}{r.sub.cancelAtPeriodEnd ? " · não renova" : ""}</Pill> : <span className="text-tinta-soft">—</span>}</td>
                <td>{dateBR(r.createdAt)}</td>
                <td>{r.lastSeenAt ? dateBR(r.lastSeenAt) : "—"}</td>
                <td><RoleSelect id={r.id} role={r.role} self={r.id === me.id} /></td>
                <td><BlockToggle id={r.id} blocked={r.status === "blocked"} self={r.id === me.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-tinta-soft">E-mails aparecem mascarados na lista. Toda mudança de papel ou bloqueio fica registrada com quem fez e quando.</p>
    </div>
  );
}
