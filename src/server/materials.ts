import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { materials, users, type MaterialKind, type Tone } from "@/db/schema";
import { UserError } from "@/lib/errors";
import { firstName } from "@/lib/format";
import { awardBadgesForRule, recordActivity } from "./gamification";
import { getJourney, journeyAnswers, syncAutoMissions } from "./journey";

/**
 * Materiais de venda gerados a partir das respostas da jornada.
 * Nesta versão o texto vem de MODELOS PRONTOS preenchidos com as respostas (determinístico, sem custo).
 * A troca por um modelo de IA de verdade (Fase 3) acontece só em `generate()`.
 */
export const MATERIAL_KINDS: { kind: MaterialKind; label: string }[] = [
  { kind: "business_name", label: "Nome do negócio" },
  { kind: "description", label: "Descrição do serviço" },
  { kind: "offer", label: "Oferta comercial" },
  { kind: "instagram_post", label: "Post para Instagram" },
  { kind: "whatsapp", label: "Mensagem WhatsApp" },
  { kind: "catalog", label: "Catálogo" },
  { kind: "proposal", label: "Orçamento e proposta" },
  { kind: "service_script", label: "Roteiro de atendimento" },
  { kind: "delivery_checklist", label: "Checklist de entrega" },
];

export const TONES: { value: Tone; label: string }[] = [
  { value: "simpatico", label: "Simpático" },
  { value: "direto", label: "Direto" },
  { value: "formal", label: "Formal" },
];

export type MaterialContext = {
  name: string;
  opportunity: string;
  product: string;
  audience: string;
  deliver: string;
  result: string;
  differential: string;
  price: string;
  deadline: string;
  adjustments: string;
  channel: string;
};

const ph = (v: string | undefined, fallback: string) => (v && v.trim() ? v.trim() : `[${fallback}]`);

export async function buildContext(userId: string): Promise<MaterialContext> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const a = await journeyAnswers(userId);
  const j = await getJourney(userId);
  const priceNum = a["preco"]?.preco;
  return {
    name: firstName(user?.name ?? ""),
    opportunity: j.opportunity?.title ?? "meu trabalho",
    product: ph(a["produto"]?.produto, "o que você vende"),
    audience: ph(a["publico"]?.publico ?? a["oferta"]?.para_quem, "seu público"),
    deliver: ph(a["oferta"]?.o_que ?? a["produto"]?.produto, "o que você entrega"),
    result: ph(a["oferta"]?.resultado, "o resultado para o cliente"),
    differential: ph(a["diferencial"]?.diferencial, "seu diferencial"),
    price: priceNum ? `R$ ${priceNum.replace(".", ",")}` : "[seu preço]",
    deadline: ph(a["garantia"]?.prazo ?? a["entrega"]?.prazo, "prazo de entrega"),
    adjustments: ph(a["garantia"]?.ajustes, "nº de ajustes"),
    channel: ph(a["canais"]?.canal, "seu canal principal"),
  };
}

type Gen = (c: MaterialContext) => string;
const T: Record<MaterialKind, Record<Tone, Gen[]>> = {
  business_name: {
    simpatico: [
      (c) => `Ideias de nome (escolha uma e ajuste):\n\n1. ${c.name} Cria\n2. Ateliê ${c.name}\n3. ${c.name} Faz Acontecer\n4. Toque ${c.name}\n\nDica: confira se o nome está livre no Instagram antes de decidir.`,
      (c) => `Mais ideias de nome:\n\n1. Casa ${c.name}\n2. ${c.name} & Cia\n3. Feito por ${c.name}\n4. Jeitinho ${c.name}\n\nDica: nomes curtos são mais fáceis de lembrar e de achar.`,
    ],
    direto: [(c) => `Ideias de nome:\n\n1. ${c.name} ${c.opportunity.split(" ")[0]}\n2. ${c.name} Studio\n3. ${c.name} Serviços\n4. ${c.name} Pro`],
    formal: [(c) => `Sugestões de nome comercial:\n\n1. ${c.name} Soluções\n2. ${c.name} Serviços Especializados\n3. Estúdio ${c.name}\n\nAntes de registrar um nome, consulte um profissional sobre marca e formalização.`],
  },
  description: {
    simpatico: [
      (c) => `Oi! Meu nome é ${c.name} e trabalho com ${c.product.toLowerCase()} para ${c.audience.toLowerCase()}. Meu jeito: ${c.differential.toLowerCase()}. A ideia é simples: ${c.result.toLowerCase()}.`,
      (c) => `${c.product}, feito com carinho para ${c.audience.toLowerCase()}. O que me diferencia: ${c.differential.toLowerCase()}. Bora conversar?`,
    ],
    direto: [(c) => `${c.product} para ${c.audience.toLowerCase()}. ${c.differential}. Entrega em ${c.deadline.toLowerCase()}.`],
    formal: [(c) => `Ofereço ${c.product.toLowerCase()} para ${c.audience.toLowerCase()}, com foco em ${c.result.toLowerCase()}. Diferencial: ${c.differential.toLowerCase()}.`],
  },
  offer: {
    simpatico: [
      (c) => `✨ ${c.deliver}\nPara: ${c.audience}\nVocê ganha: ${c.result}\nInvestimento: ${c.price}\nPrazo: ${c.deadline} · ${c.adjustments} ajuste(s) incluso(s)\n\nPrimeira vez? Me chama que eu explico tudo sem compromisso.`,
      (c) => `Que tal ${c.result.toLowerCase()}? Eu cuido de ${c.deliver.toLowerCase()} para você.\n\nValor: ${c.price} · Entrega: ${c.deadline}.`,
    ],
    direto: [(c) => `${c.deliver} — ${c.price}.\nPara ${c.audience.toLowerCase()}. Entrega em ${c.deadline.toLowerCase()}. ${c.adjustments} ajuste(s).`],
    formal: [(c) => `Proposta de serviço\n\nEscopo: ${c.deliver}\nPúblico: ${c.audience}\nResultado esperado: ${c.result}\nValor: ${c.price}\nPrazo: ${c.deadline}\nAjustes inclusos: ${c.adjustments}`],
  },
  instagram_post: {
    simpatico: [
      (c) => `Você sabia que dá para ${c.result.toLowerCase()} sem complicação? 💚\n\nEu faço ${c.product.toLowerCase()} para ${c.audience.toLowerCase()}, com ${c.differential.toLowerCase()}.\n\n📩 Me chama no direct ou no WhatsApp!\n\n#empreendedorismo #${c.opportunity.replace(/\s+/g, "").toLowerCase()}`,
      (c) => `Bastidores de hoje ✨ Mais um trabalho de ${c.product.toLowerCase()} saindo do forno!\nSe você é ${c.audience.toLowerCase()} e quer ${c.result.toLowerCase()}, me chama 😉`,
    ],
    direto: [(c) => `${c.product} para ${c.audience.toLowerCase()}.\n✔ ${c.differential}\n✔ Entrega em ${c.deadline.toLowerCase()}\nOrçamento pelo direct.`],
    formal: [(c) => `Atendemos ${c.audience.toLowerCase()} com ${c.product.toLowerCase()}. Solicite um orçamento pelo direct.`],
  },
  whatsapp: {
    simpatico: [
      (c) => `Oi, [nome]! Tudo bem? Aqui é ${c.name} e faço ${c.product.toLowerCase()} para ${c.audience.toLowerCase()}. Posso te mandar 2 exemplos? Se gostar, o primeiro sai com valor de estreia. 😊`,
      (c) => `Oi, [nome]! Aqui é ${c.name} 😊 Vi seu trabalho e pensei que ${c.product.toLowerCase()} poderia te ajudar a ${c.result.toLowerCase()}. Quer ver como fica?`,
    ],
    direto: [(c) => `Olá, [nome]. Aqui é ${c.name}, trabalho com ${c.product.toLowerCase()}. Valor: ${c.price}, entrega em ${c.deadline.toLowerCase()}. Posso te enviar exemplos?`],
    formal: [(c) => `Bom dia, [nome]. Meu nome é ${c.name} e presto serviço de ${c.product.toLowerCase()} para ${c.audience.toLowerCase()}. Posso enviar uma apresentação com exemplos e valores?`],
  },
  catalog: {
    simpatico: [(c) => `CATÁLOGO · ${c.name}\n\n1) ${c.deliver} — ${c.price}\n2) Pacote mensal — [valor]\n3) Avulso de teste — [valor]\n\nComo funciona: você me conta o que precisa, eu mostro uma prévia e ajusto até ${c.adjustments} vez(es).\nPagamento: Pix ou [forma].`],
    direto: [(c) => `${c.name} · Tabela\n- ${c.deliver}: ${c.price}\n- Pacote: [valor]\n- Prazo: ${c.deadline}`],
    formal: [(c) => `Catálogo de serviços — ${c.name}\n\nServiço principal: ${c.deliver}\nValor: ${c.price}\nCondições: ${c.adjustments} ajuste(s); prazo ${c.deadline}.\nFormas de pagamento: [a definir].`],
  },
  proposal: {
    simpatico: [(c) => `Orçamento para [cliente]\n\nO que vou fazer: ${c.deliver}\nResultado: ${c.result}\nPrazo: ${c.deadline}\nAjustes: ${c.adjustments}\nValor: ${c.price}\nPagamento: [50% no início e 50% na entrega]\nValidade: 7 dias\n\nQualquer dúvida, me chama! — ${c.name}`],
    direto: [(c) => `Orçamento — [cliente]\nServiço: ${c.deliver}\nValor: ${c.price}\nPrazo: ${c.deadline}\nValidade: 7 dias`],
    formal: [(c) => `PROPOSTA COMERCIAL\nCliente: [nome]\nPrestadora: ${c.name}\n\n1. Escopo: ${c.deliver}\n2. Prazo: ${c.deadline}\n3. Revisões: ${c.adjustments}\n4. Investimento: ${c.price}\n5. Pagamento: [condições]\n6. Validade: 7 dias\n\nModelo informativo. Para contratos, consulte um advogado.`],
  },
  service_script: {
    simpatico: [(c) => `Roteiro de atendimento\n\n1. Cumprimente pelo nome e agradeça o contato.\n2. Pergunte: “O que você precisa hoje?”\n3. Mostre 2 exemplos do seu trabalho.\n4. Apresente a oferta: ${c.deliver} por ${c.price}.\n5. Se disser “tá caro”: explique o que está incluso (${c.adjustments} ajustes, prazo ${c.deadline}).\n6. Combine o próximo passo e anote no quadro de clientes.`],
    direto: [(c) => `1. Entender a necessidade\n2. Mostrar exemplos\n3. Passar o valor (${c.price})\n4. Combinar prazo (${c.deadline})\n5. Registrar no quadro`],
    formal: [(c) => `Protocolo de atendimento\n1. Identificação e saudação\n2. Levantamento da necessidade\n3. Apresentação do portfólio\n4. Proposta (${c.price})\n5. Formalização do pedido e prazo (${c.deadline})\n6. Registro e acompanhamento`],
  },
  delivery_checklist: {
    simpatico: [(c) => `Checklist de entrega\n☐ Confirmei o pedido por escrito\n☐ Recebi o pagamento combinado\n☐ Fiz ${c.deliver.toLowerCase()}\n☐ Revisei tudo antes de enviar\n☐ Entreguei dentro de ${c.deadline.toLowerCase()}\n☐ Perguntei se ficou bom\n☐ Pedi um depoimento ou indicação`],
    direto: [() => `☐ Pedido confirmado\n☐ Pagamento\n☐ Produção\n☐ Revisão\n☐ Entrega\n☐ Pós-venda`],
    formal: [() => `Controle de entrega\n☐ Pedido formalizado\n☐ Pagamento conferido no extrato\n☐ Execução\n☐ Conferência de qualidade\n☐ Entrega e aceite do cliente\n☐ Registro no financeiro`],
  },
};

export function generate(kind: MaterialKind, tone: Tone, variant: number, ctx: MaterialContext) {
  const list = T[kind][tone];
  return list[((variant % list.length) + list.length) % list.length](ctx);
}

export async function listMaterials(userId: string) {
  return db.select().from(materials).where(eq(materials.userId, userId));
}

export async function previewMaterial(userId: string, kind: MaterialKind, tone: Tone, variant: number) {
  const ctx = await buildContext(userId);
  return generate(kind, tone, variant, ctx);
}

export async function saveMaterial(userId: string, kind: MaterialKind, tone: Tone, variant: number, content: string, edited: boolean) {
  if (!MATERIAL_KINDS.some((k) => k.kind === kind)) throw new UserError("Tipo de material inválido.");
  const text = content.trim().slice(0, 6000);
  if (!text) throw new UserError("O material está vazio.");
  const existing = await db.query.materials.findFirst({ where: and(eq(materials.userId, userId), eq(materials.kind, kind)) });
  await db
    .insert(materials)
    .values({ userId, kind, tone, variant, content: text, edited })
    .onConflictDoUpdate({ target: [materials.userId, materials.kind], set: { tone, variant, content: text, edited, updatedAt: new Date() } });
  if (!existing) {
    await recordActivity(userId, "event", `Material criado: ${MATERIAL_KINDS.find((k) => k.kind === kind)?.label}`, 10);
    await awardBadgesForRule(userId, "first_material");
    await syncAutoMissions(userId);
  }
}
