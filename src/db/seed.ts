import { eq } from "drizzle-orm";
import { db } from "./index";
import * as s from "./schema";
import { OPPORTUNITIES, STAGES, MISSIONS, BADGES, CONTENTS, LEGAL_CONTENTS, PLANS } from "./seed-data";
import { LEGAL_DOCS } from "./legal-docs";
import { hashPassword } from "@/server/auth";

/** Insere só o que falta (não sobrescreve edições feitas no admin). */
export async function seedBase() {
  for (const o of OPPORTUNITIES) await db.insert(s.opportunities).values(o).onConflictDoNothing();
  for (const st of STAGES) await db.insert(s.stages).values(st).onConflictDoNothing();
  for (const m of MISSIONS)
    await db.insert(s.missions).values({ ...m, autoKey: m.autoKey ?? null, dependsOnKey: m.dependsOnKey ?? null }).onConflictDoNothing();
  for (const b of BADGES) await db.insert(s.badges).values(b).onConflictDoNothing();
  const opps = await db.select().from(s.opportunities);
  for (const c of CONTENTS) {
    const { opportunitySlug, ...rest } = c;
    await db
      .insert(s.contents)
      .values({ ...rest, opportunityId: opportunitySlug ? (opps.find((o) => o.slug === opportunitySlug)?.id ?? null) : null, status: "published" })
      .onConflictDoNothing();
  }
  for (const l of LEGAL_CONTENTS) await db.insert(s.legalContents).values(l).onConflictDoNothing();
  const existingDocs = await db.select().from(s.legalDocuments);
  for (const d of LEGAL_DOCS)
    if (!existingDocs.some((e) => e.kind === d.kind && e.version === d.version))
      await db.insert(s.legalDocuments).values({ ...d, status: "published", lawyerReviewed: false });
  for (const p of PLANS) await db.insert(s.plans).values(p).onConflictDoNothing();
  await db.insert(s.billingSettings).values({ id: 1 }).onConflictDoNothing();
  await db.insert(s.coupons).values({ code: "PARCEIRO", percentOff: 20, firstPeriodOnly: true, active: false }).onConflictDoNothing();

  // Variante de missão para uma oportunidade (exemplo do editor de missões)
  const videos = opps.find((o) => o.slug === "videos-curtos");
  const publico = await db.query.missions.findFirst({ where: eq(s.missions.key, "publico") });
  if (videos && publico)
    await db
      .insert(s.missionVariants)
      .values({ missionId: publico.id, opportunityId: videos.id, example: "Confeiteiras do bairro que precisam de vídeos para o Instagram.", tools: ["Instagram", "Google Maps", "CapCut"] })
      .onConflictDoNothing();
}

export async function ensureUser(name: string, email: string, password: string, role: s.Role, verified = true) {
  const existing = await db.query.users.findFirst({ where: eq(s.users.email, email) });
  if (existing) return existing;
  const [u] = await db
    .insert(s.users)
    .values({ name, email, passwordHash: await hashPassword(password), role, emailVerifiedAt: verified ? new Date() : null })
    .returning();
  await db.insert(s.consents).values([
    { userId: u.id, kind: "terms", version: "1.0", granted: true },
    { userId: u.id, kind: "privacy", version: "1.0", granted: true },
  ]);
  return u;
}
