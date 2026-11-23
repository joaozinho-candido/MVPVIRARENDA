function emailVerificationRequired() {
  const raw = (process.env.REQUIRE_EMAIL_VERIFICATION ?? "").trim().replace(/^["']|["']$/g, "").toLowerCase();
  if (["false", "falso", "0", "no", "nao", "não", "off"].includes(raw)) return false;
  if (["true", "verdadeiro", "1", "yes", "sim", "on"].includes(raw)) return true;
  const canDeliver = !!process.env.EMAIL_PROVIDER || process.env.DEV_MAILBOX === "true" || process.env.NODE_ENV !== "production";
  return canDeliver;
}

export const config = {
  appUrl:
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  /**
   * Exigir e-mail confirmado antes de assinar.
   * Padrão: só exige quando há como o e-mail chegar (provedor configurado em EMAIL_PROVIDER ou a caixa
   * de desenvolvimento /dev/emails ligada). Sem isso a confirmação seria impossível.
   * REQUIRE_EMAIL_VERIFICATION=true/false força o comportamento.
   */
  requireEmailVerification: emailVerificationRequired(),
  isProd: process.env.NODE_ENV === "production",
  /** Mostra a caixa de e-mails de desenvolvimento em /dev/emails. Nunca habilite em produção real. */
  devMailbox: process.env.DEV_MAILBOX === "true" || process.env.NODE_ENV !== "production",
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? "dev-webhook-secret-troque-em-producao",
  cronSecret: process.env.CRON_SECRET ?? "",
  bcryptCost: process.env.NODE_ENV === "test" ? 4 : 12,
  sessionDays: 30,
  passwordMin: 8,
  resetTokenMinutes: 60,
  verifyTokenHours: 48,
  support: {
    email: process.env.SUPPORT_EMAIL ?? "[e-mail de suporte]",
    whatsapp: process.env.SUPPORT_WHATSAPP ?? "[número]",
    company: process.env.COMPANY_NAME ?? "[Razão social]",
    cnpj: process.env.COMPANY_CNPJ ?? "[__]",
    dpoEmail: process.env.DPO_EMAIL ?? "[e-mail do encarregado]",
  },
  legalVersions: { terms: "1.0", privacy: "1.0" },
};
