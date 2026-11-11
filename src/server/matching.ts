import type { QuizAnswers } from "@/db/schema";
import { labelFor } from "@/lib/quiz";

/**
 * Compatibilidade = habilidades + tempo + equipamentos + orçamento + preferência online/presencial
 * (+ interesses e conforto com vendas como ajuste fino).
 * Função pura: fácil de testar e de ajustar.
 * Se faltar um recurso obrigatório, a oportunidade NÃO é escondida: ela aparece com aviso de limite.
 */
export type OpportunityForScore = {
  id: string;
  title: string;
  mode: "online" | "presencial" | "ambos";
  phoneOnly: boolean;
  requiredEquipment: string[];
  scoringSkills: string[];
  scoringInterests: string[];
  investmentMin: number;
  minHoursPerDay: number; // x10
  salesIntensity: "baixo" | "medio" | "alto";
};

export type Compatibility = { score: number; reasons: string[]; limits: string[] };

const EQUIPMENT_LABEL: Record<string, string> = {
  celular: "celular",
  internet: "internet",
  computador: "computador",
  cozinha: "cozinha equipada",
  costura: "máquina de costura",
  ferramentas: "ferramentas",
  transporte: "transporte",
  impressora: "impressora",
};

export const WEIGHTS = { skills: 35, time: 15, equipment: 20, budget: 15, mode: 15 } as const;

export function computeCompatibility(a: QuizAnswers, o: OpportunityForScore): Compatibility {
  const reasons: string[] = [];
  const limits: string[] = [];

  // Habilidades (inclui o que pedem ajuda e a pergunta adaptativa)
  const userSkills = new Set([...a.skills, ...a.helpWith, ...(a.timeFlies ?? [])].filter((s) => s !== "nao_sei"));
  const matched = o.scoringSkills.filter((s) => userSkills.has(s));
  const skillRatio = o.scoringSkills.length ? Math.min(1, matched.length / Math.min(2, o.scoringSkills.length)) : 0.5;
  const skillPts = WEIGHTS.skills * skillRatio;
  if (matched.length) reasons.push(`você tem jeito para ${matched.map((m) => labelFor("skills", m).toLowerCase()).join(" e ")}`);

  // Interesses: bônus de até 5 pontos (dentro do teto de 100)
  const interestMatch = o.scoringInterests.filter((i) => a.interests.includes(i));
  const interestPts = interestMatch.length ? 5 : 0;
  if (interestMatch.length) reasons.push(`gosta de ${interestMatch.map((i) => labelFor("interests", i).toLowerCase()).join(" e ")}`);

  // Tempo
  const need = o.minHoursPerDay / 10;
  const timeRatio = a.hoursPerDay >= need ? 1 : a.hoursPerDay / need;
  const timePts = WEIGHTS.time * timeRatio;
  if (timeRatio >= 1) reasons.push(`cabe no seu tempo (${formatHours(a.hoursPerDay)} por dia)`);
  else limits.push(`Pede cerca de ${formatHours(need)} por dia. Você disse que tem ${formatHours(a.hoursPerDay)}.`);

  // Equipamentos
  const missing = o.requiredEquipment.filter((e) => !a.equipment.includes(e));
  const eqRatio = o.requiredEquipment.length ? 1 - missing.length / o.requiredEquipment.length : 1;
  const eqPts = WEIGHTS.equipment * eqRatio;
  if (missing.length) {
    const names = missing.map((m) => EQUIPMENT_LABEL[m] ?? m).join(" e ");
    limits.push(
      missing.includes("computador") && a.equipment.includes("celular")
        ? `Pede computador. Você disse que hoje usa só o celular.`
        : `Pede ${names}, que você não marcou.`,
    );
  } else if (o.requiredEquipment.length) {
    reasons.push(o.phoneOnly ? "dá para fazer só com o celular" : "você já tem o equipamento");
  }

  // Orçamento
  const budgetRatio = o.investmentMin <= a.budget ? 1 : a.budget / Math.max(1, o.investmentMin);
  const budgetPts = WEIGHTS.budget * budgetRatio;
  if (budgetRatio >= 1) reasons.push("cabe no seu orçamento");
  else limits.push(`Para começar pede uns R$ ${o.investmentMin}. Você disse que pode investir até R$ ${a.budget}.`);

  // Online x presencial
  let modePts: number = WEIGHTS.mode;
  if (a.mode !== "tanto_faz" && o.mode !== "ambos" && o.mode !== a.mode) {
    modePts = WEIGHTS.mode * 0.2;
    limits.push(o.mode === "presencial" ? "É presencial e você prefere online." : "É online e você prefere presencial.");
  } else if (a.mode !== "tanto_faz") {
    reasons.push(a.mode === "online" ? "dá para fazer de casa" : "dá para fazer perto de casa");
  }

  // Conforto com vendas (ajuste, nunca elimina)
  let salesAdj = 0;
  if (o.salesIntensity === "alto" && a.salesComfort === "baixo") {
    salesAdj = -6;
    limits.push("Exige abordar clientes com frequência. A Lia te ajuda com textos prontos.");
  }

  const raw = skillPts + interestPts + timePts + eqPts + budgetPts + modePts + salesAdj;
  const score = Math.max(5, Math.min(99, Math.round(raw)));
  return { score, reasons: reasons.slice(0, 4), limits };
}

export function rankOpportunities<T extends OpportunityForScore>(a: QuizAnswers, list: T[]) {
  return list
    .map((o) => ({ opportunity: o, ...computeCompatibility(a, o) }))
    .sort((x, y) => y.score - x.score || x.opportunity.title.localeCompare(y.opportunity.title));
}

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} minutos`;
  if (h === 1) return "1 hora";
  return `${String(h).replace(".", ",")} horas`;
}
