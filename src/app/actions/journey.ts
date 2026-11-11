"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { funnelEvents } from "@/db/schema";
import { requirePaid, requireUser } from "@/server/session";
import { saveMissionDraft, completeMission } from "@/server/journey";
import { saveTalentProfile, chooseOpportunity } from "@/server/profile";
import { fail } from "@/lib/errors";

export async function trackQuizStart() {
  await db.insert(funnelEvents).values({ kind: "quiz_started" });
}

export async function saveQuizAction(answers: unknown) {
  const u = await requireUser();
  try {
    const r = await saveTalentProfile(u.id, answers);
    revalidatePath("/app", "layout");
    return { ok: true as const, chosenStillFits: r.chosenStillFits };
  } catch (e) {
    return fail(e);
  }
}

export async function chooseOpportunityAction(opportunityId: string) {
  const u = await requirePaid();
  try {
    await chooseOpportunity(u.id, opportunityId);
    revalidatePath("/app", "layout");
    return { ok: true as const };
  } catch (e) {
    return fail(e);
  }
}

export async function saveDraftAction(missionId: string, answers: Record<string, string>, checks: boolean[], pause = false) {
  const u = await requirePaid();
  try {
    const r = await saveMissionDraft(u.id, missionId, answers, checks, pause);
    if (pause) revalidatePath("/app", "layout");
    return { ok: true as const, status: r.status };
  } catch (e) {
    return fail(e);
  }
}

export async function completeMissionAction(missionId: string, answers: Record<string, string>, checks: boolean[]) {
  const u = await requirePaid();
  try {
    const r = await completeMission(u.id, missionId, answers, checks);
    revalidatePath("/app", "layout");
    return { ok: true as const, result: r };
  } catch (e) {
    return fail(e);
  }
}
