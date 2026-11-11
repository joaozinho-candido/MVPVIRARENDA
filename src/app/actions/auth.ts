"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  registerUser,
  verifyCredentials,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
  changePassword,
} from "@/server/auth";
import { saveTalentProfile } from "@/server/profile";
import { startSession, endSession, requireUser } from "@/server/session";
import { fail, type ActionResult } from "@/lib/errors";

function safeNext(next: FormDataEntryValue | null, fallback: string) {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

export async function registerAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  let target = "/app";
  try {
    const user = await registerUser({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      acceptTerms: fd.get("terms") === "on",
      marketing: fd.get("marketing") === "on",
    });
    await startSession(user.id);
    const quiz = fd.get("quiz");
    if (typeof quiz === "string" && quiz) {
      try {
        await saveTalentProfile(user.id, JSON.parse(quiz));
        target = "/app/oportunidades?novo=1";
      } catch {
        target = "/app/talentos/questionario";
      }
    } else target = "/app/talentos/questionario";
  } catch (e) {
    return fail(e);
  }
  redirect(target);
}

export async function loginAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  let user;
  try {
    user = await verifyCredentials(String(fd.get("email") ?? ""), String(fd.get("password") ?? ""));
    await startSession(user.id);
  } catch (e) {
    return fail(e);
  }
  redirect(safeNext(fd.get("next"), user.role === "user" ? "/app" : "/admin"));
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}

export async function forgotAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requestPasswordReset(String(fd.get("email") ?? ""));
  return { ok: true, message: "Se houver uma conta com este e-mail, mandamos um link para criar uma nova senha. Ele vale por 1 hora." };
}

export async function resetAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    if (fd.get("password") !== fd.get("confirm")) return { ok: false, error: "As senhas não são iguais.", field: "confirm" };
    await resetPassword(String(fd.get("token") ?? ""), String(fd.get("password") ?? ""));
  } catch (e) {
    return fail(e);
  }
  redirect("/entrar?senha=nova");
}

export async function resendVerificationAction(): Promise<ActionResult> {
  const u = await requireUser();
  if (u.emailVerified) return { ok: true, message: "Seu e-mail já está confirmado." };
  await sendVerificationEmail(u.id, u.email, u.name);
  return { ok: true, message: "Enviamos um novo link para o seu e-mail." };
}

export async function updateNameAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const u = await requireUser();
  const name = String(fd.get("name") ?? "").trim().slice(0, 80);
  if (name.length < 2) return { ok: false, error: "Como podemos te chamar?" };
  await db.update(users).set({ name }).where(eq(users.id, u.id));
  return { ok: true, message: "Dados salvos." };
}

export async function changePasswordAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const u = await requireUser();
  try {
    await changePassword(u.id, String(fd.get("current") ?? ""), String(fd.get("next") ?? ""));
    return { ok: true, message: "Senha alterada." };
  } catch (e) {
    return fail(e);
  }
}
