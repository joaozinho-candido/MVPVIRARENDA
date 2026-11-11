import { getSessionUser } from "@/server/session";
import { exportUserData } from "@/server/privacy";
import { audit } from "@/server/audit";

/** Exportação LGPD feita pelo admin a pedido do titular (fica registrada na auditoria). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getSessionUser();
  if (!u || u.role !== "admin") return new Response("Não autorizado", { status: 403 });
  const { id } = await params;
  const data = await exportUserData(id);
  await audit(u, "user.export_data", "user", id);
  return new Response(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="dados-${id}.json"`, "Cache-Control": "no-store" } });
}
