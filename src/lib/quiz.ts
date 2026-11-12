import { z } from "zod";
import type { QuizAnswers } from "@/db/schema";

export type Option = { value: string; label: string };
export type Question =
  | {
      id: keyof QuizAnswers;
      kind: "multi" | "single";
      title: string;
      hint?: string;
      options: Option[];
      adaptive?: false;
    }
  | { id: "hoursPerDay" | "budget" | "goal"; kind: "scale"; title: string; hint?: string; options: Option[] }
  | { id: "experienceText"; kind: "text"; title: string; hint?: string; options: [] };

export const SKILLS: Option[] = [
  { value: "fotos", label: "Fotos" },
  { value: "videos", label: "Vídeos" },
  { value: "redes", label: "Redes sociais" },
  { value: "cozinhar", label: "Cozinhar" },
  { value: "organizar", label: "Organizar" },
  { value: "ensinar", label: "Ensinar" },
  { value: "consertar", label: "Consertar" },
  { value: "costurar", label: "Costurar" },
  { value: "artesanato", label: "Artesanato" },
  { value: "atendimento", label: "Atendimento" },
  { value: "escrever", label: "Escrever" },
  { value: "beleza", label: "Beleza" },
  { value: "cuidar", label: "Cuidar de pessoas ou pets" },
  { value: "planilhas", label: "Planilhas e computador" },
  { value: "vender", label: "Vender" },
  { value: "design", label: "Design e artes" },
];

export const QUESTIONS: Question[] = [
  {
    id: "skills",
    kind: "multi",
    title: "O que você sabe fazer bem?",
    hint: "Escolha quantas quiser. Vale o que você faz no dia a dia, mesmo sem ganhar por isso.",
    options: SKILLS,
  },
  {
    id: "interests",
    kind: "multi",
    title: "Quais assuntos te interessam?",
    hint: "Escolha quantas quiser.",
    options: [
      { value: "beleza", label: "Beleza e moda" },
      { value: "comida", label: "Comida" },
      { value: "comercio", label: "Comércio local" },
      { value: "tecnologia", label: "Tecnologia" },
      { value: "educacao", label: "Educação" },
      { value: "festas", label: "Festas e presentes" },
      { value: "casa", label: "Casa e decoração" },
      { value: "pets", label: "Pets" },
      { value: "saude", label: "Bem-estar" },
      { value: "negocios", label: "Pequenos negócios" },
    ],
  },
  {
    id: "helpWith",
    kind: "multi",
    title: "O que as pessoas te pedem ajuda?",
    hint: "Escolha quantas quiser. Se não lembrar de nada, marque “Não sei”. Tudo bem!",
    options: [
      { value: "fotos", label: "Arrumar fotos e vídeos" },
      { value: "redes", label: "Postar nas redes" },
      { value: "cozinhar", label: "Fazer um doce ou salgado" },
      { value: "organizar", label: "Organizar coisas ou papéis" },
      { value: "ensinar", label: "Explicar uma matéria" },
      { value: "consertar", label: "Consertar algo" },
      { value: "planilhas", label: "Mexer no computador" },
      { value: "beleza", label: "Cabelo, unha ou maquiagem" },
      { value: "escrever", label: "Escrever uma mensagem ou texto" },
      { value: "nao_sei", label: "Não sei" },
    ],
  },
  {
    id: "timeFlies",
    kind: "multi",
    title: "Não sabe seu talento? Tudo bem. Quando o tempo voa, você está…",
    hint: "Pergunta extra para te conhecer melhor. Escolha quantas quiser.",
    options: [
      { value: "atendimento", label: "Conversando com gente" },
      { value: "artesanato", label: "Criando com as mãos" },
      { value: "organizar", label: "Organizando coisas" },
      { value: "redes", label: "Mexendo no celular" },
      { value: "cozinhar", label: "Na cozinha" },
      { value: "ensinar", label: "Ensinando alguém" },
    ],
  },
  {
    id: "experiences",
    kind: "multi",
    title: "Que experiências você já teve?",
    hint: "Trabalhos, cursos ou atividades. Escolha quantas quiser.",
    options: [
      { value: "vendas", label: "Vendas ou loja" },
      { value: "atendimento", label: "Atendimento ao público" },
      { value: "escritorio", label: "Escritório ou administração" },
      { value: "cozinha", label: "Cozinha ou alimentação" },
      { value: "beleza", label: "Salão ou estética" },
      { value: "educacao", label: "Escola ou reforço" },
      { value: "manutencao", label: "Manutenção ou obras" },
      { value: "cuidado", label: "Cuidado de pessoas" },
      { value: "nenhuma", label: "Ainda nenhuma" },
    ],
  },
  {
    id: "period",
    kind: "multi",
    title: "Em que horários você costuma ter tempo livre?",
    options: [
      { value: "manha", label: "Manhã" },
      { value: "tarde", label: "Tarde" },
      { value: "noite", label: "Noite" },
      { value: "fds", label: "Fim de semana" },
    ],
  },
  {
    id: "hoursPerDay",
    kind: "scale",
    title: "Quanto tempo por dia você tem?",
    options: [
      { value: "0.5", label: "Até 30 minutos" },
      { value: "1", label: "Cerca de 1 hora" },
      { value: "2.5", label: "2 a 3 horas" },
      { value: "4", label: "Mais de 3 horas" },
    ],
  },
  {
    id: "equipment",
    kind: "multi",
    title: "O que você já tem para trabalhar?",
    hint: "Marque só o que você usa hoje.",
    options: [
      { value: "celular", label: "Celular com câmera" },
      { value: "internet", label: "Internet em casa" },
      { value: "computador", label: "Computador ou notebook" },
      { value: "cozinha", label: "Cozinha equipada" },
      { value: "costura", label: "Máquina de costura" },
      { value: "ferramentas", label: "Ferramentas" },
      { value: "transporte", label: "Carro, moto ou bicicleta" },
      { value: "impressora", label: "Impressora" },
    ],
  },
  {
    id: "budget",
    kind: "scale",
    title: "Quanto você pode investir para começar?",
    hint: "Pense em um valor que não aperte as contas da casa.",
    options: [
      { value: "0", label: "Nada por enquanto" },
      { value: "100", label: "Até R$ 100" },
      { value: "500", label: "Até R$ 500" },
      { value: "1500", label: "Mais de R$ 500" },
    ],
  },
  {
    id: "mode",
    kind: "single",
    title: "Prefere trabalhar online ou presencialmente?",
    options: [
      { value: "online", label: "Online, de casa" },
      { value: "presencial", label: "Presencial, perto de casa" },
      { value: "tanto_faz", label: "Tanto faz" },
    ],
  },
  {
    id: "salesComfort",
    kind: "single",
    title: "Como você se sente oferecendo seu trabalho?",
    options: [
      { value: "baixo", label: "Tenho vergonha, prefiro mensagem" },
      { value: "medio", label: "Consigo, com um texto pronto" },
      { value: "alto", label: "Gosto de conversar e vender" },
    ],
  },
  {
    id: "goal",
    kind: "scale",
    title: "Tem uma meta de renda extra por mês?",
    hint: "Opcional. É uma referência para planejar, não uma promessa de ganho.",
    options: [
      { value: "", label: "Prefiro não dizer" },
      { value: "300", label: "Uns R$ 300" },
      { value: "800", label: "Uns R$ 800" },
      { value: "1500", label: "R$ 1.500 ou mais" },
    ],
  },
];

/** Perguntas exibidas, considerando a pergunta adaptativa. 11 fixas + 1 extra para quem trava. */
export function visibleQuestions(answers: Partial<QuizAnswers>): Question[] {
  const help = answers.helpWith ?? [];
  const stuck =
    help.includes("nao_sei") || (answers.helpWith !== undefined && help.length === 0 && (answers.skills ?? []).length === 0);
  return QUESTIONS.filter((q) => q.id !== "timeFlies" || stuck);
}

export const quizSchema = z.object({
  skills: z.array(z.string()).max(20),
  interests: z.array(z.string()).max(20),
  helpWith: z.array(z.string()).max(20),
  timeFlies: z.array(z.string()).max(20).optional(),
  experiences: z.array(z.string()).max(20),
  experienceText: z.string().max(300).optional(),
  period: z.array(z.string()).max(4),
  hoursPerDay: z.number().min(0).max(24),
  equipment: z.array(z.string()).max(20),
  budget: z.number().min(0).max(1_000_000),
  mode: z.enum(["online", "presencial", "tanto_faz"]),
  salesComfort: z.enum(["baixo", "medio", "alto"]),
  salesPreference: z.string().max(200).optional(),
  goal: z.number().min(0).max(1_000_000).nullable(),
});

export function labelFor(questionId: string, value: string): string {
  const q = QUESTIONS.find((x) => x.id === questionId);
  return q?.options.find((o) => o.value === value)?.label ?? value;
}

export function labelsFor(questionId: string, values: string[] | undefined): string {
  return (values ?? []).map((v) => labelFor(questionId, v)).join(", ");
}
