export type MentorKey = "Bia" | "Caio" | "Duda" | "Lia" | "Nando" | "Rosa";

export const MENTORS: Record<MentorKey, { role: string; quote: string; bg: string; fg: string; does: string }> = {
  Bia: { role: "Descoberta de talentos", quote: "Me conta: o que as pessoas vivem te pedindo ajuda?", bg: "bg-vira-light", fg: "text-vira-dark", does: "Faz o questionário com você e monta seu retrato de talentos." },
  Caio: { role: "Oportunidades", quote: "Achei 3 caminhos que cabem no seu tempo e no seu orçamento.", bg: "bg-sol-light", fg: "text-[#7A5A00]", does: "Compara oportunidades com prós, riscos e limites." },
  Duda: { role: "Missões e jornada", quote: "A missão de hoje é curta: 15 minutos para definir sua oferta.", bg: "bg-festa-light", fg: "text-festa-dark", does: "Cuida da sua jornada: são 14 etapas, do talento à primeira venda. Cada etapa é dividida em missões curtas, de 10 a 15 minutos, que dizem o objetivo, mostram um exemplo e pedem uma resposta sua. Ao concluir uma missão você ganha pontos e a próxima se abre. Se pausar, nada se perde." },
  Lia: { role: "Materiais de venda", quote: "Escrevi sua mensagem de WhatsApp. Quer um tom mais simpático?", bg: "bg-[#E4ECFF]", fg: "text-[#2F4FA8]", does: "Escreve textos de venda a partir das suas respostas." },
  Nando: { role: "Meus clientes", quote: "A Ana pediu retorno na quinta. Deixo um lembrete para você?", bg: "bg-[#EDE3FF]", fg: "text-[#5B3BA8]", does: "Ajuda a não esquecer ninguém no quadro de clientes." },
  Rosa: { role: "Dinheiro e organização", quote: "Separei vendas e custos. Seu lucro estimado do mês está aqui.", bg: "bg-[#FFE3EE]", fg: "text-[#A3245A]", does: "Organiza vendas, custos e o que levar ao contador." },
};

export const MENTOR_ORDER: MentorKey[] = ["Bia", "Caio", "Duda", "Lia", "Nando", "Rosa"];

export function mentor(name: string) {
  return MENTORS[(name as MentorKey) in MENTORS ? (name as MentorKey) : "Duda"];
}
