import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { userFromSessionToken, createSession, destroySession, type SessionUser } from "./auth";
import { hasAccess } from "./billing/subscriptions";
import { config } from "@/lib/config";
import type { Role } from "@/db/schema";

export const SESSION_COOKIE = "vr_session";

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  return userFromSessionToken(jar.get(SESSION_COOKIE)?.value);
});

export async function startSession(userId: string) {
  const { token, expiresAt } = await createSession(userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  jar.delete(SESSION_COOKIE);
}

export async function requireUser(next = "/app"): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return u;
}

export const userHasAccess = cache(async (userId: string) => hasAccess(userId));

/** Áreas pagas: acesso só com pagamento confirmado no servidor. */
export async function requirePaid(next = "/app"): Promise<SessionUser> {
  const u = await requireUser(next);
  if (u.role !== "user") return u; // equipe interna pode visualizar
  if (!(await userHasAccess(u.id))) redirect("/app?bloqueado=1");
  return u;
}

export const STAFF_ROLES: Role[] = ["admin", "editor", "reviewer"];

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const u = await requireUser("/admin");
  if (!roles.includes(u.role)) redirect("/app");
  return u;
}
