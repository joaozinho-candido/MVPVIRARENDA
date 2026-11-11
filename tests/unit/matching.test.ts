import { describe, it, expect } from "vitest";
import { computeCompatibility, rankOpportunities } from "@/server/matching";
import { OPPORTUNITIES } from "@/db/seed-data";
import { saveTalentProfile, getRecommendations, chooseOpportunity } from "@/server/profile";
import { visibleQuestions, QUESTIONS } from "@/lib/quiz";
import { getProfile } from "@/server/profile";
import { ANSWERS, newUser } from "./helpers";

const opps = OPPORTUNITIES.map((o, i) => ({ ...o, id: String(i) }));

describe("questionário", () => {
  it("tem 11 perguntas fixas e 1 adaptativa para quem não sabe o talento", () => {
    expect(QUESTIONS.filter((q) => q.id !== "timeFlies")).toHaveLength(11);
    expect(visibleQuestions({ helpWith: ["fotos"] })).toHaveLength(11);
    expect(visibleQuestions({ helpWith: ["nao_sei"] })).toHaveLength(12);
  });

  it("salva o perfil e permite editar depois", async () => {
    const u = await newUser();
    await saveTalentProfile(u.id, ANSWERS);
    await saveTalentProfile(u.id, { ...ANSWERS, hoursPerDay: 4 });
    const p = await getProfile(u.id);
    expect(p?.answers.hoursPerDay).toBe(4);
    expect(p?.completedAt).toBeTruthy();
  });

  it("recusa respostas inválidas", async () => {
    const u = await newUser();
    await expect(saveTalentProfile(u.id, { ...ANSWERS, mode: "lua" })).rejects.toThrow(/incompletas/);
  });
});

describe("compatibilidade", () => {
  it("quem tem fotos, redes, celular e 1h por dia recebe vídeos curtos em 1º", () => {
    const ranked = rankOpportunities(ANSWERS, opps.filter((o) => o.status === "published"));
    expect(ranked[0].opportunity.slug).toBe("videos-curtos");
    expect(ranked[0].score).toBeGreaterThanOrEqual(85);
  });

  it("falta de recurso obrigatório gera aviso de limite, sem esconder a oportunidade", () => {
    const va = opps.find((o) => o.slug === "assistencia-virtual")!;
    const r = computeCompatibility(ANSWERS, va);
    expect(r.limits.join(" ")).toMatch(/Pede computador/);
    expect(r.score).toBeGreaterThan(0);
    const all = rankOpportunities(ANSWERS, opps);
    expect(all.some((x) => x.opportunity.slug === "assistencia-virtual")).toBe(true);
  });

  it("orçamento e tempo insuficientes reduzem a nota e explicam o motivo", () => {
    const doces = opps.find((o) => o.slug === "doces-por-encomenda")!;
    const r = computeCompatibility({ ...ANSWERS, budget: 0, hoursPerDay: 0.5, equipment: ["celular"] }, doces);
    expect(r.limits.some((l) => l.includes("R$"))).toBe(true);
    expect(r.limits.some((l) => l.includes("por dia"))).toBe(true);
  });

  it("recomendações ficam salvas e só é possível escolher entre as 3 primeiras", async () => {
    const u = await newUser();
    await saveTalentProfile(u.id, ANSWERS);
    const recs = await getRecommendations(u.id);
    expect(recs.length).toBeGreaterThanOrEqual(3);
    expect(recs[0].rec.score).toBeGreaterThanOrEqual(recs[1].rec.score);
    await expect(chooseOpportunity(u.id, recs[5].opp.id)).rejects.toThrow(/3 caminhos/);
    await chooseOpportunity(u.id, recs[1].opp.id);
  });

  it("editar o perfil avisa se a escolhida deixou de combinar", async () => {
    const u = await newUser();
    await saveTalentProfile(u.id, ANSWERS);
    const recs = await getRecommendations(u.id);
    await chooseOpportunity(u.id, recs[0].opp.id); // vídeos curtos
    const r = await saveTalentProfile(u.id, {
      ...ANSWERS,
      skills: ["cozinhar"],
      helpWith: ["cozinhar"],
      interests: ["comida"],
      equipment: ["cozinha", "computador"],
      mode: "presencial",
      budget: 500,
      hoursPerDay: 4,
    });
    expect(r.chosenStillFits).toBe(false);
  });
});
