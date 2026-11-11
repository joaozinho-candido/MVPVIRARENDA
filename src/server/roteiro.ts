import { journeyAnswers, getJourney } from "./journey";
import { dateBR } from "@/lib/format";

export const DEFAULT_QUESTIONS = [
  "Que enquadramento serve para minha atividade (por exemplo, MEI ou outro)?",
  "Preciso emitir nota fiscal? Para quais clientes?",
  "Que impostos pago e quando?",
  "Com quanto de faturamento preciso me preocupar com formalização?",
  "Como separar o dinheiro pessoal do negócio?",
  "Existe alguma licença ou regra específica para o que eu vendo?",
];

export const DOCUMENTS = ["Documento de identidade e CPF", "Comprovante de endereço", "Descrição do que você vende e para quem", "Registros de vendas e custos (exporte do Financeiro)", "Previsão de quanto pretende faturar por mês"];

/** Roteiro para a consulta com contador. A plataforma prepara perguntas; a orientação vem do profissional. */
export async function buildRoteiro(userId: string, userName: string) {
  const a = await journeyAnswers(userId);
  const j = await getJourney(userId);
  const own = (a["contador"]?.perguntas ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const lines = [
    "ROTEIRO DA CONSULTA COM CONTADOR(A)",
    `Preparado no Vira Renda para ${userName} em ${dateBR(new Date())}`,
    "",
    "SOBRE A MINHA ATIVIDADE",
    `- Oportunidade: ${j.opportunity?.title ?? "[ainda não escolhida]"}`,
    `- O que vendo: ${a["produto"]?.produto ?? "[a definir]"}`,
    `- Para quem: ${a["publico"]?.publico ?? "[a definir]"}`,
    `- Preço: ${a["preco"]?.preco ? "R$ " + a["preco"].preco : "[a definir]"}`,
    "",
    "PERGUNTAS",
    ...[...DEFAULT_QUESTIONS, ...own].map((q, i) => `${i + 1}. ${q}`),
    "",
    "DOCUMENTOS PARA LEVAR",
    ...DOCUMENTS.map((d) => `[ ] ${d}`),
    "",
    "ANOTAÇÕES DA CONSULTA",
    "_______________________________________________",
    "_______________________________________________",
    "",
    "Este roteiro é um apoio de organização. Não é parecer contábil nem jurídico.",
    "Procure um profissional habilitado (contador com CRC ativo; advogado com OAB ativa).",
  ];
  return lines.join("\n");
}
