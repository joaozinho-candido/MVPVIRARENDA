import { handleWebhook } from "@/server/billing/subscriptions";

/**
 * Webhook do gateway de pagamento. Única porta que libera/bloqueia acesso.
 * Assinatura: cabeçalho `x-signature` = HMAC-SHA256(corpo, PAYMENT_WEBHOOK_SECRET).
 * Ao integrar um gateway real, ajuste o nome do cabeçalho/validação no adaptador.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const result = await handleWebhook(raw, req.headers.get("x-signature"));
  const status = result === "invalid_signature" ? 401 : result === "unknown_payment" ? 404 : 200;
  return Response.json({ result }, { status });
}
