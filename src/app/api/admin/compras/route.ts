import { getSessionUser } from "@/server/session";
import { listPayments } from "@/server/admin";
import { audit } from "@/server/audit";

export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "admin") return new Response("Não autorizado", { status: 403 });
  const url = new URL(req.url);
  const rows = await listPayments(url.searchParams.get("f") ?? "all", url.searchParams.get("q") ?? "");
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    ["data", "cliente", "email", "cobranca", "valor", "meio", "status", "id_gateway"].join(";"),
    ...rows.map(({ p, email }) => [p.createdAt.toISOString(), p.customerName, email, p.periodNumber, (p.amountCents / 100).toFixed(2).replace(".", ","), p.method, p.status, p.gatewayPaymentId].map(esc).join(";")),
  ].join("\n");
  await audit(u, "payments.export_csv", "payments", "", { count: rows.length });
  return new Response("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="compras.csv"' } });
}
