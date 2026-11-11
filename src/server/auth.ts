import bcrypt from "bcryptjs";
import { and, eq, gt, isNull, sql, count } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, sessions, authTokens, loginAttempts, consents, type Role } from "@/db/schema";
import { config } from "@/lib/config";
import { randomToken, sha256 } from "@/lib/crypto";
import { UserError } from "@/lib/errors";
import { sendEmail, link, footer } from "./email";
import { firstName } from "@/lib/format";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  prefs: { sound: boolean; clientReminderEmails: boolean };
};

const emailSchema = z.string().trim().toLowerCase().email("Confira o e-mail: falta algo, como o @ ou o .com");

export function normalizeEmail(email: string) {
  const r = emailSchema.safeParse(email);
  if (!r.success) throw new UserError(r.error.issues[0].message, "email");
  return r.data;
}

export function validatePassword(password: string) {
  if (password.length < config.passwordMin)
    throw new UserError(`A senha precisa ter pelo menos ${config.passwordMin} caracteres.`, "password");
  if (password.length > 200) throw new UserError("Senha longa demais.", "password");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, config.bcryptCost);
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  acceptTerms: boolean;
  marketing?: boolean;
}) {
  const name = input.name.trim().slice(0, 80);
  if (name.length < 2) throw new UserError("Como podemos te chamar?", "name");
  const email = normalizeEmail(input.email);
  validatePassword(input.password);
  if (!input.acceptTerms) throw new UserError("Para criar a conta, é preciso aceitar os Termos e a Privacidade.", "terms");

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) throw new UserError("Já existe uma conta com este e-mail. Entre ou recupere a senha.", "email");

  const passwordHash = await hashPassword(input.password);
  const [user] = await db.insert(users).values({ name, email, passwordHash }).returning();
  await db.insert(consents).values([
    { userId: user.id, kind: "terms", version: config.legalVersions.terms, granted: true },
    { userId: user.id, kind: "privacy", version: config.legalVersions.privacy, granted: true },
    { userId: user.id, kind: "marketing_email", version: config.legalVersions.privacy, granted: !!input.marketing },
  ]);
  await sendVerificationEmail(user.id, user.email, user.name);
  return user;
}

async function issueToken(userId: string, type: "verify_email" | "reset_password", minutes: number) {
  const token = randomToken();
  await db.insert(authTokens).values({
    userId,
    type,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + minutes * 60_000),
  });
  return token;
}

export async function sendVerificationEmail(userId: string, email: string, name: string) {
  const token = await issueToken(userId, "verify_email", config.verifyTokenHours * 60);
  await sendEmail({
    to: email,
    userId,
    template: "verify_email",
    subject: "Confirme seu e-mail no Vira Renda",
    body: `Oi, ${firstName(name)}!\n\nConfirme seu e-mail para liberar a assinatura:\n${link(`/confirmar-email?token=${token}`)}\n\nO link vale por ${config.verifyTokenHours} horas.${footer}`,
  });
}

async function consumeToken(token: string, type: "verify_email" | "reset_password") {
  const row = await db.query.authTokens.findFirst({
    where: and(
      eq(authTokens.tokenHash, sha256(token)),
      eq(authTokens.type, type),
      isNull(authTokens.usedAt),
      gt(authTokens.expiresAt, new Date()),
    ),
  });
  if (!row) return null;
  // Uso único: marca como usado de forma atômica
  const updated = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.id, row.id), isNull(authTokens.usedAt)))
    .returning();
  return updated.length ? row : null;
}

export async function verifyEmail(token: string) {
  const row = await consumeToken(token, "verify_email");
  if (!row) throw new UserError("Este link venceu ou já foi usado. Peça um novo no seu perfil.");
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, row.userId));
  return row.userId;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MIN = 15;

export async function verifyCredentials(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const since = new Date(Date.now() - WINDOW_MIN * 60_000);
  const [{ value: failures }] = await db
    .select({ value: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.email, email), eq(loginAttempts.success, false), gt(loginAttempts.createdAt, since)));
  if (failures >= MAX_ATTEMPTS)
    throw new UserError(`Muitas tentativas. Espere ${WINDOW_MIN} minutos ou recupere a senha.`);

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  // Compara mesmo sem usuário, para não revelar quais e-mails existem pelo tempo de resposta
  const ok = await bcrypt.compare(password, user?.passwordHash ?? "$2a$04$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
  await db.insert(loginAttempts).values({ email, success: !!(ok && user) });
  if (!user || !ok) throw new UserError("E-mail ou senha não conferem. Tente de novo ou recupere a senha.");
  if (user.status === "blocked") throw new UserError("Esta conta está bloqueada. Fale com o suporte.");
  return user;
}

export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + config.sessionDays * 86_400_000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, userId));
  return { token, expiresAt };
}

export async function userFromSessionToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const rows = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row || row.user.status === "blocked") return null;
  const u = row.user;
  // Atualiza "último acesso" no máximo a cada 10 minutos
  if (!u.lastSeenAt || Date.now() - u.lastSeenAt.getTime() > 600_000) {
    await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, u.id));
  }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    emailVerified: !!u.emailVerifiedAt,
    prefs: u.prefs,
  };
}

export async function destroySession(token: string) {
  await db.delete(sessions).where(eq(sessions.id, sha256(token)));
}

export async function requestPasswordReset(emailInput: string) {
  let email: string;
  try {
    email = normalizeEmail(emailInput);
  } catch {
    return; // Resposta sempre igual: não revela se o e-mail existe
  }
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return;
  const token = await issueToken(user.id, "reset_password", config.resetTokenMinutes);
  await sendEmail({
    to: user.email,
    userId: user.id,
    template: "reset_password",
    subject: "Crie uma nova senha",
    body: `Oi, ${firstName(user.name)}!\n\nRecebemos um pedido para criar uma nova senha. Use o link abaixo:\n${link(`/redefinir-senha?token=${token}`)}\n\nEle vale por 1 hora. Se não foi você, ignore este e-mail: sua senha continua a mesma.${footer}`,
  });
}

export async function resetPassword(token: string, newPassword: string) {
  validatePassword(newPassword);
  const row = await consumeToken(token, "reset_password");
  if (!row) throw new UserError("Este link venceu ou já foi usado. Peça um novo em “Esqueci minha senha”.");
  await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, row.userId));
  // Encerra todas as sessões abertas por segurança
  await db.delete(sessions).where(eq(sessions.userId, row.userId));
  return row.userId;
}

export async function changePassword(userId: string, current: string, next: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || !(await bcrypt.compare(current, user.passwordHash)))
    throw new UserError("A senha atual não confere.", "current");
  validatePassword(next);
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, userId));
}

export async function purgeExpired() {
  await db.delete(sessions).where(sql`${sessions.expiresAt} < now()`);
  await db.delete(loginAttempts).where(sql`${loginAttempts.createdAt} < now() - interval '1 day'`);
}
