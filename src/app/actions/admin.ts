"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  plans,
  billingSettings,
  coupons,
  users,
  opportunities,
  missions,
  missionVariants,
  stages,
  contents,
  badges,
  privacyRequests,
  subscriptions,
  type Role,
  type MissionField,
  type UnlockCondition,
} from "@/db/schema";
import { requireRole } from "@/server/session";
import { audit } from "@/server/audit";
import { refundPayment, runBillingCycle, getCurrentSubscription } from "@/server/billing/subscriptions";
import { saveLegal, transitionLegal, commentLegal, type LegalAction } from "@/server/legal";
import { eraseAccount } from "@/server/privacy";
import { sendEmail, link, footer } from "@/server/email";
import { fail, UserError, type ActionResult } from "@/lib/errors";
import { parseBRL, firstName } from "@/lib/format";

const ADMIN: Role[] = ["admin"];
const EDITORS: Role[] = ["admin", "editor"];
const LEGAL: Role[] = ["admin", "editor", "reviewer"];

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const lines = (fd: FormData, k: string) => str(fd, k).split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* ------------------------------ Planos e preço ------------------------------ */
export async function savePlanAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const actor = await requireRole(ADMIN);
  const id = str(fd, "id");
  const price = parseBRL(str(fd, "price"));
  const firstRaw = str(fd, "first");
  const first = firstRaw ? parseBRL(firstRaw) : null;
  if (price == null || price <= 0) return { ok: false, error: "Informe a mensalidade." };
  if (firstRaw && first == null) return { ok: false, error: "Preço promocional inválido." };
  const before = await db.query.plans.findFirst({ where: eq(plans.id, id) });
  await db
    .update(plans)
    .set({ priceCents: price, firstPeriodPriceCents: first, active: fd.get("active") === "on", name: str(fd, "name") || before?.name, updatedAt: new Date() })
    .where(eq(plans.id, id));
  await audit(actor, "plan.update", "plan", id, { before: { price: before?.priceCents, first: before?.firstPeriodPriceCents, active: before?.active }, after: { price, first, active: fd.get("active") === "on" } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Plano salvo. O novo preço vale para novas assinaturas." };
}

export async function saveBillingSettingsAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const actor = await requireRole(ADMIN);
  const n = (k: string, min: number, max: number) => Math.min(max, Math.max(min, Number(str(fd, k)) || 0));
  const values = {
    noticeDaysBefore: n("noticeDaysBefore", 1, 15),
    pauseAfterDays: n("pauseAfterDays", 1, 60),
    pixExpiresMinutes: n("pixExpiresMinutes", 5, 1440),
    promoOnlyFirstSubscription: fd.get("promoOnlyFirst") === "on",
    updatedAt: new Date(),
  };
  await db.update(billingSettings).set(values).where(eq(billingSettings.id, 1));
  await audit(actor, "billing.settings", "billing_settings", "1", values);
  return { ok: true, message: "Regras de cobrança salvas." };
}

export async function saveCouponAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const actor = await requireRole(ADMIN);
  const code = str(fd, "code").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const pct = Number(str(fd, "percentOff"));
  if (!code || !(pct > 0 && pct <= 100)) return { ok: false, error: "Informe código e desconto entre 1 e 100%." };
  await db
    .insert(coupons)
    .values({ code, percentOff: pct, firstPeriodOnly: fd.get("firstPeriodOnly") === "on", active: true })
    .onConflictDoUpdate({ target: coupons.code, set: { percentOff: pct, firstPeriodOnly: fd.get("firstPeriodOnly") === "on" } });
  await audit(actor, "coupon.save", "coupon", code, { pct });
  revalidatePath("/admin/planos");
  return { ok: true, message: "Cupom salvo." };
}

export async function toggleCouponAction(code: string, active: boolean) {
  const actor = await requireRole(ADMIN);
  await db.update(coupons).set({ active }).where(eq(coupons.code, code));
  await audit(actor, active ? "coupon.activate" : "coupon.deactivate", "coupon", code);
  revalidatePath("/admin/planos");
}

export async function runBillingNowAction() {
  const actor = await requireRole(ADMIN);
  const r = await runBillingCycle();
  await audit(actor, "billing.run", "billing", "", r);
  revalidatePath("/admin", "layout");
  return r;
}

/* ------------------------------- Assinantes -------------------------------- */
export async function refundAction(paymentId: string) {
  const actor = await requireRole(ADMIN);
  try {
    await refundPayment(paymentId);
    await audit(actor, "payment.refund", "payment", paymentId);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/admin", "layout");
  return { ok: true as const };
}

export async function adminCancelRenewalAction(userId: string) {
  const actor = await requireRole(ADMIN);
  const cur = await getCurrentSubscription(userId);
  if (!cur) return;
  await db.update(subscriptions).set({ cancelAtPeriodEnd: true, canceledAt: new Date() }).where(eq(subscriptions.id, cur.sub.id));
  await audit(actor, "subscription.cancel_renewal", "user", userId);
  revalidatePath(`/admin/assinantes/${userId}`);
}

export async function resendAccessAction(userId: string) {
  const actor = await requireRole(ADMIN);
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u) return;
  await sendEmail({
    to: u.email,
    userId,
    template: "welcome_payment_confirmed",
    subject: "Seu acesso ao Vira Renda",
    body: `Oi, ${firstName(u.name)}!\n\nVocê pode entrar a qualquer momento em ${link("/entrar")}.\nEsqueceu a senha? ${link("/recuperar-senha")}${footer}`,
  });
  await audit(actor, "user.resend_access", "user", userId);
}

export async function adminDeleteUserAction(userId: string, confirmEmail: string) {
  const actor = await requireRole(ADMIN);
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u) return { ok: false as const, error: "Usuário não encontrado." };
  if (confirmEmail.trim().toLowerCase() !== u.email) return { ok: false as const, error: "Digite o e-mail da conta para confirmar." };
  if (u.role !== "user") return { ok: false as const, error: "Remova o papel de equipe antes de excluir." };
  await eraseAccount(userId);
  await audit(actor, "user.delete", "user", userId, { reason: "pedido LGPD" });
  redirect("/admin/usuarios?excluido=1");
}

export async function setRoleAction(userId: string, role: Role) {
  const actor = await requireRole(ADMIN);
  if (userId === actor.id) throw new UserError("Você não pode mudar o próprio papel.");
  await db.update(users).set({ role }).where(eq(users.id, userId));
  await audit(actor, "user.role", "user", userId, { role });
  revalidatePath("/admin/usuarios");
}

export async function setBlockedAction(userId: string, blocked: boolean) {
  const actor = await requireRole(ADMIN);
  if (userId === actor.id) return;
  await db.update(users).set({ status: blocked ? "blocked" : "active" }).where(eq(users.id, userId));
  await audit(actor, blocked ? "user.block" : "user.unblock", "user", userId);
  revalidatePath("/admin/usuarios");
}

export async function resolvePrivacyRequestAction(id: number) {
  const actor = await requireRole(ADMIN);
  await db.update(privacyRequests).set({ status: "done", resolvedAt: new Date() }).where(eq(privacyRequests.id, id));
  await audit(actor, "privacy.resolve", "privacy_request", String(id));
  revalidatePath("/admin/lgpd");
}

/* ----------------------------- Oportunidades ------------------------------- */
export async function saveOpportunityAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const actor = await requireRole(EDITORS);
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title) return { ok: false, error: "Título obrigatório." };
  const publish = str(fd, "intent") === "publish";
  const values = {
    title,
    description: str(fd, "description"),
    buyers: str(fd, "buyers"),
    howToFindBuyers: str(fd, "howToFindBuyers"),
    risks: str(fd, "risks"),
    skillsText: str(fd, "skillsText"),
    equipmentText: str(fd, "equipmentText"),
    investmentLevel: (str(fd, "investmentLevel") || "baixo") as "baixo" | "medio" | "alto",
    investmentMin: Math.max(0, Number(str(fd, "investmentMin")) || 0),
    timeText: str(fd, "timeText"),
    difficulty: Math.min(3, Math.max(1, Number(str(fd, "difficulty")) || 2)),
    costsText: str(fd, "costsText"),
    suggestedPrice: str(fd, "suggestedPrice"),
    whereToSell: str(fd, "whereToSell"),
    mode: (str(fd, "mode") || "online") as "online" | "presencial" | "ambos",
    phoneOnly: fd.get("phoneOnly") === "on",
    requiredEquipment: fd.getAll("requiredEquipment").map(String),
    scoringSkills: fd.getAll("scoringSkills").map(String),
    scoringInterests: fd.getAll("scoringInterests").map(String),
    minHoursPerDay: Math.round((Number(str(fd, "minHours").replace(",", ".")) || 0.5) * 10),
    salesIntensity: (str(fd, "salesIntensity") || "medio") as "baixo" | "medio" | "alto",
    status: publish ? ("published" as const) : ("draft" as const),
    sortOrder: Number(str(fd, "sortOrder")) || 0,
    updatedAt: new Date(),
  };
  if (publish && (!values.description || !values.buyers || !values.risks))
    return { ok: false, error: "Para publicar, preencha descrição, quem compra e riscos." };
  let savedId = id;
  if (id) await db.update(opportunities).set(values).where(eq(opportunities.id, id));
  else savedId = (await db.insert(opportunities).values({ ...values, slug: `${slugify(title)}-${Date.now().toString(36)}` }).returning())[0].id;
  await audit(actor, publish ? "opportunity.publish" : "opportunity.save_draft", "opportunity", savedId);
  revalidatePath("/", "layout");
  redirect(`/admin/oportunidades/${savedId}?salvo=1`);
}

/* -------------------------------- Missões ---------------------------------- */
export async function saveMissionAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const actor = await requireRole(EDITORS);
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title || !str(fd, "objective")) return { ok: false, error: "Título e objetivo são obrigatórios." };
  let fields: MissionField[] = [];
  try {
    fields = JSON.parse(str(fd, "fields") || "[]");
  } catch {
    return { ok: false, error: "Campos inválidos." };
  }
  const values = {
    stageNumber: Number(str(fd, "stageNumber")),
    order: Number(str(fd, "order")) || 1,
    title,
    mentor: str(fd, "mentor") || "Duda",
    minutes: Number(str(fd, "minutes")) || 10,
    points: Math.max(0, Number(str(fd, "points")) || 0),
    objective: str(fd, "objective"),
    explanation: str(fd, "explanation"),
    example: str(fd, "example"),
    tools: lines(fd, "tools"),
    checklist: str(fd, "checklist").split("\n").map((x) => x.trim()).filter(Boolean),
    fields,
    dependsOnKey: str(fd, "dependsOnKey") || null,
    status: (str(fd, "intent") === "publish" ? "published" : "draft") as "published" | "draft",
    updatedAt: new Date(),
  };
  let savedId = id;
  // Mudar uma missão publicada não apaga respostas de quem já fez (progresso fica em mission_progress)
  if (id) await db.update(missions).set(values).where(eq(missions.id, id));
  else savedId = (await db.insert(missions).values({ ...values, key: `${slugify(title)}-${Date.now().toString(36)}` }).returning())[0].id;
  const variantOpp = str(fd, "variantOpportunityId");
  if (variantOpp) {
    await db
      .insert(missionVariants)
      .values({ missionId: savedId, opportunityId: variantOpp, example: str(fd, "variantExample"), tools: lines(fd, "variantTools") })
      .onConflictDoUpdate({ target: [missionVariants.missionId, missionVariants.opportunityId], set: { example: str(fd, "variantExample"), tools: lines(fd, "variantTools") } });
  }
  await audit(actor, "mission.save", "mission", savedId, { status: values.status });
  revalidatePath("/app", "layout");
  redirect(`/admin/missoes/${savedId}?salvo=1`);
}

export async function saveStageAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const actor = await requireRole(EDITORS);
  const number = Number(str(fd, "number"));
  await db
    .update(stages)
    .set({
      title: str(fd, "title"),
      mentor: str(fd, "mentor"),
      unlockStages: lines(fd, "unlockStages").map(Number).filter((n) => n > 0 && n < number),
      unlockConditions: fd.getAll("unlockConditions").map(String) as UnlockCondition[],
      unlockHint: str(fd, "unlockHint"),
    })
    .where(eq(stages.number, number));
  await audit(actor, "stage.save", "stage", String(number));
  revalidatePath("/admin/missoes");
  return { ok: true, message: `Etapa ${number} salva.` };
}

/* ------------------------------- Conteúdos --------------------------------- */
export async function saveContentAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const actor = await requireRole(EDITORS);
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title || !str(fd, "body")) return { ok: false, error: "Título e texto são obrigatórios." };
  const minStage = Math.min(14, Math.max(1, Number(str(fd, "minStage")) || 1));
  const maxStage = Math.min(14, Math.max(minStage, Number(str(fd, "maxStage")) || 14));
  const values = {
    title,
    category: str(fd, "category") as typeof contents.$inferInsert.category,
    kind: (str(fd, "kind") || "article") as "article" | "challenge",
    body: str(fd, "body"),
    minutes: Number(str(fd, "minutes")) || 3,
    minStage,
    maxStage,
    opportunityId: str(fd, "opportunityId") || null,
    challengeGoal: Number(str(fd, "challengeGoal")) || 0,
    challengePoints: Number(str(fd, "challengePoints")) || 0,
    status: (str(fd, "intent") === "publish" ? "published" : "draft") as "published" | "draft",
  };
  if (values.kind === "challenge" && values.challengeGoal < 1) return { ok: false, error: "Desafio precisa de uma meta (quantas vezes)." };
  let savedId = id;
  if (id) await db.update(contents).set(values).where(eq(contents.id, id));
  else savedId = (await db.insert(contents).values({ ...values, slug: `${slugify(title)}-${Date.now().toString(36)}` }).returning())[0].id;
  await audit(actor, "content.save", "content", savedId, { status: values.status });
  redirect(`/admin/conteudos/${savedId}?salvo=1`);
}

/* ------------------------------ Selos e pontos ------------------------------ */
export async function saveBadgeAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const actor = await requireRole(ADMIN);
  const key = str(fd, "key");
  await db
    .update(badges)
    .set({ name: str(fd, "name"), emoji: str(fd, "emoji"), description: str(fd, "description"), points: Number(str(fd, "points")) || 0, active: fd.get("active") === "on" })
    .where(eq(badges.key, key));
  await audit(actor, "badge.save", "badge", key);
  revalidatePath("/admin/selos");
  return { ok: true, message: "Selo salvo." };
}

/* --------------------------- Revisão jurídica ------------------------------ */
export async function saveLegalAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const actor = await requireRole(LEGAL);
  let id: string;
  try {
    const c = await saveLegal(actor, str(fd, "id") || null, {
      title: str(fd, "title"),
      area: (str(fd, "area") || "contabil") as "contabil" | "juridico",
      summary: str(fd, "summary"),
      body: str(fd, "body"),
      sourceUrl: str(fd, "sourceUrl"),
      sourceCheckedAt: str(fd, "sourceCheckedAt") || null,
      reviewerName: str(fd, "reviewerName"),
      reviewerRegistry: str(fd, "reviewerRegistry"),
      reviewAgainAt: str(fd, "reviewAgainAt") || null,
    });
    id = c.id;
  } catch (e) {
    return fail(e);
  }
  redirect(`/admin/revisao/${id}?salvo=1`);
}

export async function transitionLegalAction(id: string, action: LegalAction, message = "") {
  const actor = await requireRole(LEGAL);
  try {
    await transitionLegal(actor, id, action, message);
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/admin/revisao/${id}`);
  revalidatePath("/admin/revisao");
  return { ok: true as const };
}

export async function commentLegalAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const actor = await requireRole(LEGAL);
  try {
    await commentLegal(actor, str(fd, "id"), str(fd, "message"));
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/admin/revisao/${str(fd, "id")}`);
  return { ok: true, message: "Comentário registrado." };
}
