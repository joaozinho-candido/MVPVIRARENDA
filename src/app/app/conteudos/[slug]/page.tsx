import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentProgress } from "@/db/schema";
import { requirePaid } from "@/server/session";
import { getContent, CATEGORIES } from "@/server/content";
import { SimpleMarkdown } from "@/components/legal-doc";
import { MarkRead } from "@/components/app/content-actions";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = await requirePaid();
  const c = await getContent(slug);
  if (!c) notFound();
  const p = await db.query.contentProgress.findFirst({ where: and(eq(contentProgress.userId, u.id), eq(contentProgress.contentId, c.id)) });
  return (
    <article className="mx-auto max-w-2xl">
      <Link href="/app/conteudos" className="link text-sm">← Conteúdos</Link>
      <p className="eyebrow mt-4">{CATEGORIES.find((x) => x.value === c.category)?.label} · {c.minutes} min</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-noite">{c.title}</h1>
      <div className="card mt-5 text-[16px]"><SimpleMarkdown text={c.body} /></div>
      <div className="mt-5"><MarkRead id={c.id} read={!!p?.readAt} /></div>
    </article>
  );
}
