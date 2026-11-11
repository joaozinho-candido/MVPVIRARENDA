import { describe, it, expect } from "vitest";
import { getJourney, completeMission, saveMissionDraft } from "@/server/journey";
import { saveTalentProfile, getRecommendations, chooseOpportunity } from "@/server/profile";
import { getStats, getBadgeBoard, getHistory } from "@/server/gamification";
import { addEntry } from "@/server/finance";
import { ANSWERS, subscribedUser } from "./helpers";

async function readyUser() {
  const u = await subscribedUser();
  await saveTalentProfile(u.id, ANSWERS);
  return u;
}
const missionByKey = (j: Awaited<ReturnType<typeof getJourney>>, key: string) => j.stages.flatMap((s) => s.missions).find((m) => m.key === key)!;

describe("jornada e desbloqueio", () => {
  it("tem 14 etapas; só a 1 e a 2 abrem depois do questionário", async () => {
    const u = await readyUser();
    const j = await getJourney(u.id);
    expect(j.stages).toHaveLength(14);
    expect(missionByKey(j, "questionario").status).toBe("completed"); // missão automática
    expect(j.stages[0].status).toBe("open");
    expect(j.stages[2].status).toBe("locked");
    expect(j.stages[2].missing.join(" ")).toMatch(/escolher uma oportunidade/);
  });

  it("missão: salva rascunho, exige campos e checklist, comemora com pontos e próxima missão", async () => {
    const u = await readyUser();
    let j = await getJourney(u.id);
    const retrato = missionByKey(j, "retrato");
    await saveMissionDraft(u.id, retrato.id, { forca: "Fotos" }, [false]);
    j = await getJourney(u.id);
    expect(missionByKey(j, "retrato").status).toBe("in_progress");
    expect(missionByKey(j, "retrato").answers.forca).toBe("Fotos");
    await expect(completeMission(u.id, retrato.id, { forca: "Fotos" }, [false])).rejects.toThrow(/Revisei meu perfil/);
    const r = await completeMission(u.id, retrato.id, { forca: "Fotos" }, [true]);
    expect(r.points).toBe(30);
    expect(r.stageCompleted).toBe(true);
    expect(r.stageDone).toBe(2);
    // Editar missão antiga não tira nem duplica pontos
    const before = (await getStats(u.id)).points;
    const again = await completeMission(u.id, retrato.id, { forca: "Fotos e vídeos" }, [true]);
    expect(again.points).toBe(0);
    expect((await getStats(u.id)).points).toBe(before);
  });

  it("pausar mantém as respostas", async () => {
    const u = await readyUser();
    const j = await getJourney(u.id);
    const m = missionByKey(j, "retrato");
    await saveMissionDraft(u.id, m.id, { forca: "Organizar" }, [true], true);
    expect(missionByKey(await getJourney(u.id), "retrato").status).toBe("paused");
  });

  it("não deixa concluir missão de etapa bloqueada", async () => {
    const u = await readyUser();
    const j = await getJourney(u.id);
    const produto = missionByKey(j, "produto");
    await expect(completeMission(u.id, produto.id, { produto: "x", formato: "Serviço avulso" }, [])).rejects.toThrow(/abre quando/);
  });

  it("escolher oportunidade conclui a missão automática, dá selo e abre a etapa 3", async () => {
    const u = await readyUser();
    let j = await getJourney(u.id);
    await completeMission(u.id, missionByKey(j, "retrato").id, { forca: "Fotos" }, [true]);
    await completeMission(u.id, missionByKey(j, "comparar").id, { pesou: "tempo" }, [true, true]);
    const recs = await getRecommendations(u.id);
    await chooseOpportunity(u.id, recs[0].opp.id);
    j = await getJourney(u.id);
    expect(j.stages[1].status).toBe("done");
    expect(j.stages[2].status).toBe("open");
    expect(j.current.number).toBe(3);
    // variante por oportunidade (exemplo de "Para quem você vai vender?" para vídeos curtos)
    expect(missionByKey(j, "publico").example).toMatch(/Confeiteiras/);
    const board = await getBadgeBoard(u.id);
    expect(board.filter((b) => b.awardedAt).map((b) => b.key).sort()).toEqual(["caminho", "comecei", "talento"]);
    const hist = await getHistory(u.id);
    expect(hist.some((h) => h.title.includes("Marco: etapa 2"))).toBe(true);
    expect(j.percent).toBeGreaterThan(0);
  });

  it("dependência entre missões é respeitada", async () => {
    const u = await readyUser();
    let j = await getJourney(u.id);
    await completeMission(u.id, missionByKey(j, "retrato").id, { forca: "Fotos" }, [true]);
    await completeMission(u.id, missionByKey(j, "comparar").id, { pesou: "x" }, [true, true]);
    const recs = await getRecommendations(u.id);
    await chooseOpportunity(u.id, recs[0].opp.id);
    j = await getJourney(u.id);
    await expect(completeMission(u.id, missionByKey(j, "entrega").id, { como: "x", prazo: "3 dias" }, [])).rejects.toThrow(/Conclua antes/);
  });

  it("1ª venda registrada conclui missão automática e dá selo", async () => {
    const u = await readyUser();
    await addEntry(u.id, { kind: "sale", description: "Pacote", amountCents: 40000, date: "2026-11-03", received: true });
    const j = await getJourney(u.id);
    expect(missionByKey(j, "primeira-venda").status).toBe("completed");
    expect((await getBadgeBoard(u.id)).find((b) => b.key === "venda")?.awardedAt).toBeTruthy();
  });
});
