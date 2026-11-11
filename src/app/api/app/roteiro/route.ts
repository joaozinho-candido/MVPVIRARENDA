import { getSessionUser, userHasAccess } from "@/server/session";
import { buildRoteiro } from "@/server/roteiro";

export async function GET() {
  const u = await getSessionUser();
  if (!u) return new Response("Não autorizado", { status: 401 });
  if (u.role === "user" && !(await userHasAccess(u.id))) return new Response("Disponível no plano", { status: 403 });
  const text = await buildRoteiro(u.id, u.name);
  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": 'attachment; filename="roteiro-consulta-contador.txt"' },
  });
}
