import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { consents, users } from "@/db/schema";
import {
  registerUser,
  verifyCredentials,
  createSession,
  userFromSessionToken,
  destroySession,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from "@/server/auth";
import { uniqueEmail, lastEmail } from "./helpers";

const tokenFrom = (body: string, path: string) => new URL(body.match(new RegExp(`https?://\\S+${path}\\?token=\\S+`))![0]).searchParams.get("token")!;

describe("cadastro", () => {
  it("cria conta, grava consentimentos com versão e envia confirmação de e-mail", async () => {
    const email = uniqueEmail();
    const u = await registerUser({ name: "Camila", email: email.toUpperCase(), password: "12345678", acceptTerms: true, marketing: false });
    expect(u.email).toBe(email); // normalizado
    expect(u.passwordHash).not.toContain("12345678");
    const c = await db.select().from(consents).where(eq(consents.userId, u.id));
    expect(c.map((x) => `${x.kind}:${x.granted}:${x.version}`).sort()).toEqual(["marketing_email:false:1.0", "privacy:true:1.0", "terms:true:1.0"]);
    const mail = await lastEmail(email);
    expect(mail.template).toBe("verify_email");
    await verifyEmail(tokenFrom(mail.body, "/confirmar-email"));
    const after = await db.query.users.findFirst({ where: eq(users.id, u.id) });
    expect(after?.emailVerifiedAt).toBeTruthy();
  });

  it("recusa sem aceite dos termos, senha curta, e-mail inválido ou duplicado", async () => {
    const email = uniqueEmail();
    await expect(registerUser({ name: "A B", email, password: "12345678", acceptTerms: false })).rejects.toThrow(/Termos/);
    await expect(registerUser({ name: "A B", email, password: "123", acceptTerms: true })).rejects.toThrow(/8 caracteres/);
    await expect(registerUser({ name: "A B", email: "camila@email", password: "12345678", acceptTerms: true })).rejects.toThrow(/\.com/);
    await registerUser({ name: "A B", email, password: "12345678", acceptTerms: true });
    await expect(registerUser({ name: "A B", email, password: "12345678", acceptTerms: true })).rejects.toThrow(/Já existe/);
  });
});

describe("login e sessão", () => {
  it("entra com senha certa, cria sessão e sai", async () => {
    const email = uniqueEmail();
    await registerUser({ name: "Bia", email, password: "senha-boa-1", acceptTerms: true });
    const user = await verifyCredentials(email, "senha-boa-1");
    const { token } = await createSession(user.id);
    expect((await userFromSessionToken(token))?.email).toBe(email);
    await destroySession(token);
    expect(await userFromSessionToken(token)).toBeNull();
  });

  it("senha errada não entra e bloqueia após 5 tentativas", async () => {
    const email = uniqueEmail();
    await registerUser({ name: "Bia", email, password: "senha-boa-1", acceptTerms: true });
    for (let i = 0; i < 5; i++) await expect(verifyCredentials(email, "errada")).rejects.toThrow(/não conferem/);
    await expect(verifyCredentials(email, "senha-boa-1")).rejects.toThrow(/Muitas tentativas/);
  });
});

describe("recuperação de senha", () => {
  it("link de uso único troca a senha e derruba as sessões", async () => {
    const email = uniqueEmail();
    const u = await registerUser({ name: "Duda", email, password: "senha-antiga", acceptTerms: true });
    const { token: session } = await createSession(u.id);
    await requestPasswordReset(email);
    const mail = await lastEmail(email);
    expect(mail.template).toBe("reset_password");
    const token = tokenFrom(mail.body, "/redefinir-senha");
    await resetPassword(token, "senha-nova-123");
    expect(await userFromSessionToken(session)).toBeNull();
    await expect(resetPassword(token, "outra-senha-1")).rejects.toThrow(/venceu ou já foi usado/);
    await expect(verifyCredentials(email, "senha-nova-123")).resolves.toBeTruthy();
  });

  it("não revela se o e-mail existe", async () => {
    await expect(requestPasswordReset("ninguem@nada.com")).resolves.toBeUndefined();
  });
});
