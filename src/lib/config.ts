export const config = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
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
