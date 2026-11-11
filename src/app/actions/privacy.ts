"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser, requireUser, endSession } from "@/server/session";
import { setConsent, deleteAccount } from "@/server/privacy";
import { fail, type ActionResult } from "@/lib/errors";
import { revalidatePath } from "next/cache";

export async function saveCookieConsent(analytics: boolean) {
  const u = await getSessionUser();
  if (u) await setConsent(u.id, "analytics_cookies", analytics);
}

export async function togglePreferenceAction(key: "sound" | "clientReminderEmails" | "marketing", value: boolean) {
  const u = await requireUser();
  if (key === "marketing") await setConsent(u.id, "marketing_email", value);
  else await db.update(users).set({ prefs: { ...u.prefs, [key]: value } }).where(eq(users.id, u.id));
  revalidatePath("/app/perfil");
}

export async function deleteAccountAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const u = await requireUser();
  if (fd.get("confirm") !== "EXCLUIR") return { ok: false, error: "Digite EXCLUIR para confirmar." };
  try {
    await deleteAccount(u.id, String(fd.get("password") ?? ""));
  } catch (e) {
    return fail(e);
  }
  await endSession();
  redirect("/?conta=excluida");
}
