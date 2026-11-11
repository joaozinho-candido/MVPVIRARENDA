/**
 * Contrato do gateway de pagamento. As telas e a regra de assinatura só conhecem esta interface,
 * então o gateway é trocável sem mexer nas telas (requisito do documento de produto).
 *
 * Implementações:
 *  - DemoGateway (src/server/billing/demo-gateway.ts): nenhuma cobrança real; emite webhooks assinados.
 *  - Gateway brasileiro real (Asaas, Mercado Pago, Pagar.me, Iugu...): PENDENTE. Veja README › Pagamentos.
 */
export type ChargeInput = {
  reference: string; // id do pagamento no nosso banco
  amountCents: number;
  method: "card" | "pix";
  description: string;
  customer: { name: string; email: string };
  /** Em produção, NUNCA envie dados de cartão ao servidor: use o token gerado pelo SDK do gateway no navegador. */
  cardToken?: string;
  pixExpiresMinutes: number;
};

export type ChargeResult = {
  gatewayPaymentId: string;
  status: "pending";
  pixCode?: string;
  pixExpiresAt?: Date;
};

export type WebhookEvent = {
  id: string; // id único do evento no gateway (idempotência)
  type: "payment.approved" | "payment.refused" | "payment.expired" | "payment.refunded";
  gatewayPaymentId: string;
  reason?: string;
};

export interface PaymentGateway {
  readonly name: string;
  readonly isDemo: boolean;
  createCharge(input: ChargeInput): Promise<ChargeResult>;
  refund(gatewayPaymentId: string): Promise<void>;
  /** Valida a assinatura do webhook com o segredo do gateway. */
  verifySignature(rawBody: string, signature: string | null): boolean;
  parseEvent(rawBody: string): WebhookEvent;
}
