import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, legalContents, payments } from "@/db/schema";
import { generate, saveMaterial, listMaterials, previewMaterial, buildContext } from "@/server/materials";
import { createClient, moveClient, getClient, listClients, dueReminders, addInteraction, completeNextAction, whatsappLink } from "@/server/crm";
import { addEntry, summarize, financeOverview, markReceived } from "@/server/finance";
import { exportUserData, deleteAccount, setConsent, latestConsents } from "@/server/privacy";
import { transitionLegal, saveLegal, listPublishedGuides, autoOutdate } from "@/server/legal";
import { getFeed, advanceChallenge, markRead } from "@/server/content";
import { saveTalentProfile } from "@/server/profile";
import { newUser, subscribedUser, ANSWERS } from "./helpers";

describe("materiais de venda", () => {
  it("gera textos com as respostas, em 3 tons, com outra versão", () => {
    const ctx = { name: "Camila", opportunity: "Vídeos", product: "Vídeos curtos", audience: "Salões", deliver: "4 vídeos", result: "mais clientes", differential: "rapidez", price: "R$ 65", deadline: "3 dias", adjustments: "1", channel: "Instagram" };
    const a = generate("whatsapp", "simpatico", 0, ctx);
    const b = generate("whatsapp", "simpatico", 1, ctx);
    expect(a).toContain("Camila");
    expect(a).not.toBe(b);
    expect(generate("whatsapp", "formal", 0, ctx)).toMatch(/Bom dia/);
  });

  it("sem respostas, mostra marcadores para completar em vez de inventar", async () => {
    const u = await newUser();
    const ctx = await buildContext(u.id);
    expect(ctx.price).toBe("[seu preço]");
    expect(await previewMaterial(u.id, "offer", "direto", 0)).toContain("[seu preço]");
  });

  it("salva, edita e reaproveita um material por tipo", async () => {
    const u = await newUser();
    await saveMaterial(u.id, "whatsapp", "simpatico", 0, "Oi!", false);
    await saveMaterial(u.id, "whatsapp", "direto", 1, "Olá, editado", true);
    const list = await listMaterials(u.id);
    expect(list).toHaveLength(1);
    expect(list[0].content).toBe("Olá, editado");
    expect(list[0].edited).toBe(true);
  });
});

describe("CRM", () => {
  it("cria cliente, muda de coluna com histórico e mostra lembretes do dia", async () => {
    const u = await newUser();
    const c = await createClient(u.id, { name: "Salão Aurora", contactName: "Rafaela", phone: "(11) 98888-7777", origin: "Instagram", nextAction: "Perguntar o que achou", nextActionAt: new Date() });
    await moveClient(u.id, c.id, "abordado");
    await addInteraction(u.id, c.id, "Enviei 2 vídeos");
    const { history } = await getClient(u.id, c.id);
    expect(history.map((h) => h.note)).toEqual(expect.arrayContaining(["Status mudou para Abordado", "Enviei 2 vídeos"]));
    expect((await dueReminders(u.id)).map((x) => x.id)).toContain(c.id);
    await completeNextAction(u.id, c.id);
    expect(await dueReminders(u.id)).toHaveLength(0);
    expect(whatsappLink("(11) 98888-7777", "Oi")).toBe("https://wa.me/5511988887777?text=Oi");
  });

  it("uma pessoa não acessa os clientes de outra", async () => {
    const a = await newUser();
    const b = await newUser();
    const c = await createClient(a.id, { name: "Loja Tati" });
    await expect(getClient(b.id, c.id)).rejects.toThrow(/não encontrado/);
    await expect(moveClient(b.id, c.id, "conquistado")).rejects.toThrow(/não encontrado/);
    expect(await listClients(b.id)).toHaveLength(0);
  });
});

describe("painel financeiro", () => {
  it("separa faturamento, receita, custos e lucro estimado", () => {
    const s = summarize(
      [
        { kind: "sale", amountCents: 25000, received: true, date: "2026-11-08" },
        { kind: "sale", amountCents: 40000, received: false, date: "2026-11-03" },
        { kind: "cost", amountCents: 3500, received: true, date: "2026-11-06" },
        { kind: "expense", amountCents: 1000, received: true, date: "2026-11-01" },
        { kind: "sale", amountCents: 99900, received: true, date: "2026-10-30" },
      ],
      "2026-11",
    );
    expect(s).toEqual({ month: "2026-11", billed: 65000, received: 25000, costs: 4500, profit: 20500, toReceive: 40000 });
  });

  it("venda 'ainda não recebida' vira 'a receber' e lembrete no cliente", async () => {
    const u = await newUser();
    const c = await createClient(u.id, { name: "Clínica Flor" });
    const e = await addEntry(u.id, { kind: "sale", description: "Pacote 4 vídeos", amountCents: 40000, date: new Date().toISOString().slice(0, 10), received: false, clientId: c.id });
    let o = await financeOverview(u.id);
    expect(o.pending).toHaveLength(1);
    expect((await getClient(u.id, c.id)).client.nextAction).toMatch(/Receber/);
    await markReceived(u.id, e.id);
    o = await financeOverview(u.id);
    expect(o.pending).toHaveLength(0);
  });

  it("valida valores", async () => {
    const u = await newUser();
    await expect(addEntry(u.id, { kind: "cost", description: "App", amountCents: 0, date: "2026-11-01" })).rejects.toThrow(/maior que zero/);
  });
});

describe("conteúdo contínuo", () => {
  it("personaliza pela etapa, sobe não-lidos e conta desafios", async () => {
    const u = await newUser();
    await saveTalentProfile(u.id, ANSWERS);
    const early = await getFeed(u.id, 1, null);
    expect(early.challenge?.slug).toBe("desafio-talentos");
    const late = await getFeed(u.id, 7, null);
    expect(late.articles.some((a) => a.slug === "responder-ta-caro")).toBe(true);
    expect(late.articles.some((a) => a.slug === "calculo-preco-simples")).toBe(true);
    expect(late.articles.some((a) => a.slug === "melhorar-depois-30-dias")).toBe(false);
    const first = late.articles[0];
    await markRead(u.id, first.id);
    const after = await getFeed(u.id, 7, null);
    expect(after.articles.at(-1)!.id).toBe(first.id);
    expect(after.suggestion).toBeTruthy();
    const ch = late.challenge!;
    for (let i = 0; i < ch.challengeGoal - 1; i++) expect((await advanceChallenge(u.id, ch.id)).completed).toBe(false);
    const done = await advanceChallenge(u.id, ch.id);
    expect(done.completed).toBe(true);
    expect(done.points).toBe(ch.challengePoints);
  });
});

describe("revisão jurídica e contábil", () => {
  const editor = { id: crypto.randomUUID(), email: "e@x", name: "Editora", role: "editor" as const };
  const reviewer = { id: crypto.randomUUID(), email: "r@x", name: "Revisor", role: "reviewer" as const };
  const admin = { id: crypto.randomUUID(), email: "a@x", name: "Admin", role: "admin" as const };

  it("rascunho → revisão → aprovado (só Revisor) → publicado → desatualizado", async () => {
    const c = await saveLegal(editor, null, { title: "Guia teste", area: "contabil", summary: "s", body: "b", sourceUrl: "", sourceCheckedAt: null, reviewerName: "", reviewerRegistry: "", reviewAgainAt: null });
    await expect(transitionLegal(editor, c.id, "submit")).rejects.toThrow(/fonte oficial/);
    await saveLegal(editor, c.id, { title: "Guia teste", area: "contabil", summary: "s", body: "b", sourceUrl: "https://gov.br", sourceCheckedAt: "2026-11-01", reviewerName: "Fulana", reviewerRegistry: "CRC 1", reviewAgainAt: "2027-05-01" });
    await transitionLegal(editor, c.id, "submit");
    await expect(transitionLegal(admin, c.id, "approve")).rejects.toThrow(/Só o papel Revisor/);
    await expect(transitionLegal(editor, c.id, "publish")).rejects.toThrow(/exige estar aprovado/);
    await transitionLegal(reviewer, c.id, "approve");
    expect((await listPublishedGuides()).some((g) => g.id === c.id)).toBe(false);
    await transitionLegal(editor, c.id, "publish");
    expect((await listPublishedGuides()).some((g) => g.id === c.id)).toBe(true);
    await autoOutdate(new Date("2027-06-01T12:00:00Z"));
    const row = await db.query.legalContents.findFirst({ where: eq(legalContents.id, c.id) });
    expect(row?.status).toBe("outdated");
    expect((await listPublishedGuides()).some((g) => g.id === c.id)).toBe(false);
  });

  it("devolver exige comentário; usuário comum não edita", async () => {
    const user = { id: crypto.randomUUID(), email: "u@x", name: "U", role: "user" as const };
    await expect(saveLegal(user, null, { title: "x", area: "juridico", summary: "", body: "x", sourceUrl: "", sourceCheckedAt: null, reviewerName: "", reviewerRegistry: "", reviewAgainAt: null })).rejects.toThrow(/editores/);
    const inReview = (await db.select().from(legalContents).where(eq(legalContents.status, "in_review")))[0];
    await expect(transitionLegal(reviewer, inReview.id, "return", "")).rejects.toThrow(/comentário/);
  });
});

describe("LGPD", () => {
  it("consentimento opcional fica no histórico com versão", async () => {
    const u = await newUser();
    await setConsent(u.id, "marketing_email", true);
    expect((await latestConsents(u.id)).get("marketing_email")?.granted).toBe(true);
    await expect(setConsent(u.id, "terms", false)).rejects.toThrow(/obrigatórios/);
  });

  it("exporta todos os dados e exclui a conta mantendo pagamentos anonimizados", async () => {
    const u = await subscribedUser();
    await createClient(u.id, { name: "Cliente X" });
    const data = await exportUserData(u.id);
    expect(data.conta.email).toBe(u.email);
    expect(data.clientes).toHaveLength(1);
    expect(data.pagamentos).toHaveLength(1);
    await expect(deleteAccount(u.id, "errada")).rejects.toThrow(/Senha/);
    const pay = (await db.select().from(payments).where(eq(payments.userId, u.id)))[0];
    await deleteAccount(u.id, "senha-segura-1");
    expect(await db.query.users.findFirst({ where: eq(users.id, u.id) })).toBeUndefined();
    const anon = await db.query.payments.findFirst({ where: eq(payments.id, pay.id) });
    expect(anon?.customerName).toBe("Conta excluída");
    expect(anon?.userId).toBeNull();
  });
});
