import { and, asc, desc, eq, lt, inArray } from "drizzle-orm";
import { db } from "@/db";
import { legalContents, legalComments, type LegalStatus, type Role } from "@/db/schema";
import { UserError } from "@/lib/errors";
import { isoDay } from "@/lib/format";
import { audit } from "./audit";

export const LEGAL_STATUS: { value: LegalStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "in_review", label: "Em revisão" },
  { value: "approved", label: "Aprovado" },
  { value: "published", label: "Publicado" },
  { value: "outdated", label: "Desatualizado" },
];

type Actor = { id: string; email: string; name: string; role: Role };

/** Conteúdo vencido volta sozinho para "Desatualizado" (e sai do ar). */
export async function autoOutdate(now = new Date()) {
  const today = isoDay(now);
  const rows = await db
    .update(legalContents)
    .set({ status: "outdated", updatedAt: now })
    .where(and(inArray(legalContents.status, ["published", "approved"]), lt(legalContents.reviewAgainAt, today)))
    .returning();
  for (const r of rows)
    await db.insert(legalComments).values({ contentId: r.id, authorName: "Sistema", action: "Prazo de revisão vencido · Desatualizado" });
  return rows.length;
}

export async function listPublishedGuides() {
  await autoOutdate();
  return db.select().from(legalContents).where(eq(legalContents.status, "published")).orderBy(asc(legalContents.sortOrder));
}

export async function listAllLegal() {
  await autoOutdate();
  return db.select().from(legalContents).orderBy(asc(legalContents.sortOrder));
}

export async function getLegal(id: string) {
  const c = await db.query.legalContents.findFirst({ where: eq(legalContents.id, id) });
  if (!c) throw new UserError("Conteúdo não encontrado.");
  const comments = await db.select().from(legalComments).where(eq(legalComments.contentId, id)).orderBy(desc(legalComments.createdAt), desc(legalComments.id));
  return { content: c, comments };
}

const canEdit = (r: Role) => r === "admin" || r === "editor";
const canReview = (r: Role) => r === "reviewer";

export type LegalEdit = {
  title: string;
  area: "contabil" | "juridico";
  summary: string;
  body: string;
  sourceUrl: string;
  sourceCheckedAt: string | null;
  reviewerName: string;
  reviewerRegistry: string;
  reviewAgainAt: string | null;
};

export async function saveLegal(actor: Actor, id: string | null, data: LegalEdit) {
  if (!canEdit(actor.role)) throw new UserError("Só editores e administradores editam conteúdos.");
  if (!data.title.trim() || !data.body.trim()) throw new UserError("Título e texto são obrigatórios.");
  if (!id) {
    const slug = data.title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
    const [c] = await db.insert(legalContents).values({ ...data, slug, status: "draft" }).returning();
    await db.insert(legalComments).values({ contentId: c.id, authorName: actor.name, action: "Criou o rascunho" });
    await audit(actor, "legal.create", "legal_content", c.id);
    return c;
  }
  const before = (await getLegal(id)).content;
  // Mudou o texto de algo revisado? Volta para rascunho e sai do ar até nova revisão.
  const status: LegalStatus = "draft";
  const [c] = await db.update(legalContents).set({ ...data, status, updatedAt: new Date() }).where(eq(legalContents.id, id)).returning();
  await db.insert(legalComments).values({
    contentId: id,
    authorName: actor.name,
    action: before.status === "draft" ? "Editou o rascunho" : `Editou (estava ${label(before.status)}) · voltou para Rascunho`,
  });
  await audit(actor, "legal.edit", "legal_content", id, { from: before.status });
  return c;
}

const label = (s: LegalStatus) => LEGAL_STATUS.find((x) => x.value === s)!.label;

export type LegalAction = "submit" | "return" | "approve" | "publish" | "outdate";

export async function transitionLegal(actor: Actor, id: string, action: LegalAction, message = "") {
  const { content: c } = await getLegal(id);
  let next: LegalStatus;
  switch (action) {
    case "submit":
      if (!canEdit(actor.role)) throw new UserError("Só editores enviam para revisão.");
      if (!["draft", "outdated"].includes(c.status)) throw new UserError("Só rascunhos ou desatualizados vão para revisão.");
      if (!c.sourceUrl || !c.sourceCheckedAt) throw new UserError("Informe a fonte oficial e a data de consulta antes de enviar.");
      next = "in_review";
      break;
    case "return":
      if (!canReview(actor.role)) throw new UserError("Só o papel Revisor devolve conteúdos.");
      if (c.status !== "in_review") throw new UserError("Só conteúdos em revisão podem ser devolvidos.");
      if (!message.trim()) throw new UserError("Escreva um comentário para devolver.");
      next = "draft";
      break;
    case "approve":
      if (!canReview(actor.role)) throw new UserError("Só o papel Revisor aprova.");
      if (c.status !== "in_review") throw new UserError("Só conteúdos em revisão podem ser aprovados.");
      if (!c.reviewerName || !c.reviewerRegistry) throw new UserError("Preencha nome e registro (CRC/OAB) do revisor.");
      if (!c.reviewAgainAt) throw new UserError("Defina quando revisar de novo.");
      next = "approved";
      break;
    case "publish":
      if (!canEdit(actor.role)) throw new UserError("Só editores e administradores publicam.");
      if (c.status !== "approved") throw new UserError("Publicar exige estar aprovado.");
      next = "published";
      break;
    case "outdate":
      if (!canEdit(actor.role) && !canReview(actor.role)) throw new UserError("Sem permissão.");
      next = "outdated";
      break;
  }
  const now = new Date();
  await db
    .update(legalContents)
    .set({
      status: next,
      updatedAt: now,
      ...(next === "approved" ? { approvedAt: now } : {}),
      ...(next === "published" ? { publishedAt: now } : {}),
    })
    .where(eq(legalContents.id, id));
  await db.insert(legalComments).values({ contentId: id, authorName: actor.name, action: `${label(c.status)} → ${label(next)}`, message });
  await audit(actor, `legal.${action}`, "legal_content", id, { from: c.status, to: next });
}

export async function commentLegal(actor: Actor, id: string, message: string) {
  if (!message.trim()) throw new UserError("Escreva o comentário.");
  await db.insert(legalComments).values({ contentId: id, authorName: actor.name, action: "Comentou", message: message.trim() });
}
