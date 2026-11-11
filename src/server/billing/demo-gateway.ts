import { randomToken, hmac, safeEqual } from "@/lib/crypto";
import { config } from "@/lib/config";
import type { ChargeInput, ChargeResult, PaymentGateway, WebhookEvent } from "./gateway";

/**
 * Gateway de DEMONSTRAÇÃO. Não cobra nada e não se comunica com nenhum banco.
 * Cartões de teste (qualquer validade futura, CVV e CPF válidos):
 *   4242 4242 4242 4242 → aprovado
 *   4000 0000 0000 0002 → recusado
 *   4000 0000 0000 0341 → aprovado na 1ª cobrança, mas as mensalidades falham
 * Pix: fica "aguardando" até alguém clicar em "Simular pagamento do Pix" (só em modo demonstração).
 */
export const DEMO_CARDS = {
  approved: "4242424242424242",
  refused: "4000000000000002",
  renewalFails: "4000000000000341",
};

export type DemoCardToken = `demo_${"ok" | "refuse" | "renewfail"}_${string}`;

export function demoTokenForCard(cardNumber: string): DemoCardToken {
  const n = cardNumber.replace(/\D/g, "");
  const kind = n === DEMO_CARDS.refused ? "refuse" : n === DEMO_CARDS.renewalFails ? "renewfail" : "ok";
  return `demo_${kind}_${n.slice(-4)}`;
}

export class DemoGateway implements PaymentGateway {
  readonly name = "demo";
  readonly isDemo = true;

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const gatewayPaymentId = `demo_pay_${randomToken(9)}`;
    if (input.method === "pix") {
      return {
        gatewayPaymentId,
        status: "pending",
        pixCode: `00020126DEMO.VIRARENDA.PIX${randomToken(12)}5204000053039865406${(input.amountCents / 100).toFixed(2)}5802BR6304DEMO`,
        pixExpiresAt: new Date(Date.now() + input.pixExpiresMinutes * 60_000),
      };
    }
    return { gatewayPaymentId, status: "pending" };
  }

  async refund(): Promise<void> {
    /* Em demonstração, o estorno é confirmado pelo webhook simulado. */
  }

  sign(rawBody: string) {
    return hmac(config.webhookSecret, rawBody);
  }

  verifySignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    return safeEqual(this.sign(rawBody), signature);
  }

  parseEvent(rawBody: string): WebhookEvent {
    const e = JSON.parse(rawBody);
    if (!e?.id || !e?.type || !e?.gatewayPaymentId) throw new Error("evento inválido");
    return { id: String(e.id), type: e.type, gatewayPaymentId: String(e.gatewayPaymentId), reason: e.reason };
  }

  /** Monta um webhook assinado, como o gateway real enviaria. */
  buildEvent(type: WebhookEvent["type"], gatewayPaymentId: string, reason?: string) {
    const body = JSON.stringify({ id: `evt_${randomToken(10)}`, type, gatewayPaymentId, reason });
    return { body, signature: this.sign(body) };
  }
}

/** Decide o resultado simulado de uma cobrança de cartão a partir do token de demonstração. */
export function demoCardOutcome(token: string | undefined, isRenewal: boolean): "approved" | "refused" {
  if (!token) return "refused";
  if (token.startsWith("demo_refuse")) return "refused";
  if (token.startsWith("demo_renewfail") && isRenewal) return "refused";
  return "approved";
}
