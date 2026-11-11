import { getSessionUser } from "@/server/session";
import { exportUserData } from "@/server/privacy";

/** LGPD: download de todos os dados da pessoa. */
export async function GET() {
  const u = await getSessionUser();
  if (!u) return new Response("Não autorizado", { status: 401 });
  const data = await exportUserData(u.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="meus-dados-vira-renda.json"', "Cache-Control": "no-store" },
  });
}
