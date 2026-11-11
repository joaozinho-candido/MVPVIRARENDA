import { db } from "@/db";
import { emails } from "@/db/schema";
import { config } from "@/lib/config";

/**
 * E-mails transacionais.
 * Nesta etapa os e-mails são gravados numa fila (tabela `emails`) e podem ser vistos em /dev/emails
 * no ambiente de desenvolvimento. O envio real (Resend, SES, SMTP...) é uma integração pendente:
 * implemente `deliver()` com o provedor escolhido.
 */
export type EmailTemplate =
  | "verify_email"
  | "reset_password"
  | "welcome_payment_confirmed"
  | "renewal_notice"
  | "charge_failed"
  | "access_paused"
  | "cancel_confirmed"
  | "pix_pending"
  | "privacy_export_ready"
  | "account_deleted";

export async function sendEmail(opts: {
  to: string;
  userId?: string | null;
  template: EmailTemplate;
  subject: string;
  body: string;
}) {
  const [row] = await db
    .insert(emails)
    .values({ to: opts.to, userId: opts.userId ?? null, template: opts.template, subject: opts.subject, body: opts.body })
    .returning();
  await deliver(row.id);
  return row;
}

async function deliver(_id: number) {
  // Integração pendente: enviar via provedor de e-mail e marcar status "sent"/"failed".
  if (process.env.NODE_ENV === "development") console.info(`[email] enfileirado #${_id}`);
}

export const link = (path: string) => `${config.appUrl}${path}`;

export const footer = `\n\n—\nVira Renda · Os mentores são IA; o suporte é feito por pessoas: ${config.support.email}`;
