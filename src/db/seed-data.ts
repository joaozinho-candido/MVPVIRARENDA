import type { MissionField, UnlockCondition, AutoKey, ContentCategory } from "./schema";

/* =====================================================================
 * Biblioteca de oportunidades.
 * Valores entre colchetes são DECISÃO DO NEGÓCIO e devem ser preenchidos
 * no admin depois de pesquisa local. investmentMin e minHoursPerDay são
 * estimativas iniciais usadas no cálculo de compatibilidade.
 * ===================================================================== */
export const OPPORTUNITIES = [
  {
    slug: "videos-curtos",
    title: "Edição de vídeos curtos",
    description: "Criar vídeos de 15 a 60 segundos para negócios postarem nas redes.",
    buyers: "Salões, lojas, restaurantes e profissionais autônomos.",
    howToFindBuyers: "Negócios do bairro, indicação, Instagram local.",
    risks: "Muita concorrência; precisa de portfólio; clientes pedem ajustes.",
    skillsText: "Edição básica, olhar visual",
    equipmentText: "Celular, app de edição",
    investmentLevel: "baixo" as const,
    investmentMin: 0,
    timeText: "[__] h por vídeo",
    difficulty: 2,
    costsText: "App, internet, transporte",
    suggestedPrice: "[R$ __] por pacote",
    whereToSell: "Instagram, WhatsApp, visita a comércios",
    mode: "online" as const,
    phoneOnly: true,
    requiredEquipment: ["celular"],
    scoringSkills: ["fotos", "videos", "redes", "design"],
    scoringInterests: ["beleza", "comercio", "tecnologia"],
    minHoursPerDay: 10,
    salesIntensity: "medio" as const,
    status: "published" as const,
    sortOrder: 1,
  },
  {
    slug: "catalogos-digitais",
    title: "Catálogos digitais",
    description: "Montar catálogos em PDF ou no WhatsApp Business para comércios mostrarem seus produtos.",
    buyers: "Comércio do bairro: lojas de roupa, doces, cosméticos.",
    howToFindBuyers: "Visitar lojas do bairro, grupos de comerciantes, indicação.",
    risks: "Exige abordar comércios pessoalmente; atualização frequente de preços.",
    skillsText: "Organização, fotos, noções de design",
    equipmentText: "Celular (computador ajuda)",
    investmentLevel: "baixo" as const,
    investmentMin: 0,
    timeText: "[__] h por catálogo",
    difficulty: 1,
    costsText: "App de design, internet",
    suggestedPrice: "[R$ __] por catálogo",
    whereToSell: "Visita presencial, WhatsApp",
    mode: "online" as const,
    phoneOnly: true,
    requiredEquipment: ["celular"],
    scoringSkills: ["organizar", "fotos", "design", "vender"],
    scoringInterests: ["comercio", "negocios", "beleza"],
    minHoursPerDay: 10,
    salesIntensity: "alto" as const,
    status: "published" as const,
    sortOrder: 2,
  },
  {
    slug: "assistencia-virtual",
    title: "Assistência virtual",
    description: "Ajudar autônomos com agenda, respostas a clientes, planilhas e organização de e-mails.",
    buyers: "Autônomos ocupados: psicólogos, corretores, prestadores de serviço.",
    howToFindBuyers: "LinkedIn, indicação, grupos de profissionais.",
    risks: "Pede computador; clientes esperam resposta rápida; acesso a dados de terceiros exige cuidado.",
    skillsText: "Organização, escrita, atendimento",
    equipmentText: "Computador, internet",
    investmentLevel: "medio" as const,
    investmentMin: 100,
    timeText: "[__] h por semana por cliente",
    difficulty: 2,
    costsText: "Internet, ferramentas de agenda",
    suggestedPrice: "[R$ __] por mês por cliente",
    whereToSell: "LinkedIn, Instagram, indicação",
    mode: "online" as const,
    phoneOnly: false,
    requiredEquipment: ["computador", "internet"],
    scoringSkills: ["organizar", "escrever", "atendimento", "planilhas"],
    scoringInterests: ["negocios", "tecnologia"],
    minHoursPerDay: 20,
    salesIntensity: "medio" as const,
    status: "published" as const,
    sortOrder: 3,
  },
  {
    slug: "organizacao-digital",
    title: "Organização digital",
    description: "Organizar planilhas, arquivos, cadastros e controles de pequenos negócios.",
    buyers: "Pequenos negócios sem tempo para a parte administrativa.",
    howToFindBuyers: "Comércios do bairro, contadores parceiros, indicação.",
    risks: "Pede computador; precisa explicar bem o valor do serviço.",
    skillsText: "Planilhas, organização",
    equipmentText: "Computador",
    investmentLevel: "baixo" as const,
    investmentMin: 0,
    timeText: "[__] h por projeto",
    difficulty: 2,
    costsText: "Internet",
    suggestedPrice: "[R$ __] por projeto",
    whereToSell: "Indicação, WhatsApp, LinkedIn",
    mode: "online" as const,
    phoneOnly: false,
    requiredEquipment: ["computador"],
    scoringSkills: ["organizar", "planilhas"],
    scoringInterests: ["negocios", "tecnologia"],
    minHoursPerDay: 10,
    salesIntensity: "medio" as const,
    status: "published" as const,
    sortOrder: 4,
  },
  {
    slug: "produtos-personalizados",
    title: "Produtos personalizados",
    description: "Lembrancinhas, topos de bolo, canecas e kits personalizados para festas e datas especiais.",
    buyers: "Festas e presentes: mães, organizadores de eventos, empresas.",
    howToFindBuyers: "Instagram, feiras, grupos de mães, papelarias.",
    risks: "Exige comprar material antes; prazos apertados em datas comemorativas.",
    skillsText: "Artesanato, capricho, design",
    equipmentText: "Materiais, impressora ajuda",
    investmentLevel: "medio" as const,
    investmentMin: 200,
    timeText: "[__] h por kit",
    difficulty: 2,
    costsText: "Materiais, embalagens, transporte",
    suggestedPrice: "[R$ __] por kit",
    whereToSell: "Instagram, feiras, encomendas",
    mode: "presencial" as const,
    phoneOnly: false,
    requiredEquipment: [],
    scoringSkills: ["artesanato", "design", "costurar"],
    scoringInterests: ["festas", "casa"],
    minHoursPerDay: 20,
    salesIntensity: "medio" as const,
    status: "published" as const,
    sortOrder: 5,
  },
  {
    slug: "servicos-locais",
    title: "Serviços locais",
    description: "Pequenos reparos, montagem de móveis e ajudas práticas para vizinhos e famílias.",
    buyers: "Vizinhos e famílias do bairro.",
    howToFindBuyers: "Grupos do condomínio, indicação, aplicativos de serviços.",
    risks: "Deslocamento; segurança ao entrar na casa de terceiros; preço é comparado.",
    skillsText: "Consertar, capricho",
    equipmentText: "Ferramentas básicas, transporte ajuda",
    investmentLevel: "medio" as const,
    investmentMin: 150,
    timeText: "[__] h por serviço",
    difficulty: 1,
    costsText: "Ferramentas, transporte",
    suggestedPrice: "[R$ __] por visita",
    whereToSell: "Grupos do bairro, indicação",
    mode: "presencial" as const,
    phoneOnly: false,
    requiredEquipment: ["ferramentas"],
    scoringSkills: ["consertar", "cuidar"],
    scoringInterests: ["casa"],
    minHoursPerDay: 20,
    salesIntensity: "baixo" as const,
    status: "published" as const,
    sortOrder: 6,
  },
  {
    slug: "doces-por-encomenda",
    title: "Doces e salgados por encomenda",
    description: "Produzir doces, bolos ou salgados por encomenda para festas e datas especiais.",
    buyers: "Famílias, festas, escritórios, cafés do bairro.",
    howToFindBuyers: "WhatsApp Status, vizinhos, grupos de mães, empresas próximas.",
    risks: "Regras sanitárias e de rotulagem; ingredientes antes de receber; prazos.",
    skillsText: "Cozinhar, capricho",
    equipmentText: "Cozinha equipada",
    investmentLevel: "medio" as const,
    investmentMin: 150,
    timeText: "[__] h por encomenda",
    difficulty: 2,
    costsText: "Ingredientes, embalagens, gás",
    suggestedPrice: "[R$ __] por cento / por kg",
    whereToSell: "WhatsApp, Instagram, indicação",
    mode: "presencial" as const,
    phoneOnly: false,
    requiredEquipment: ["cozinha"],
    scoringSkills: ["cozinhar"],
    scoringInterests: ["comida", "festas"],
    minHoursPerDay: 20,
    salesIntensity: "medio" as const,
    status: "published" as const,
    sortOrder: 7,
  },
  {
    slug: "aulas-de-reforco",
    title: "Aulas de reforço",
    description: "Dar aulas particulares de reforço escolar, online ou na casa do aluno.",
    buyers: "Famílias com filhos em idade escolar.",
    howToFindBuyers: "Escolas do bairro, grupos de pais, indicação.",
    risks: "Agenda depende do calendário escolar; responsabilidade com menores.",
    skillsText: "Ensinar, paciência",
    equipmentText: "Celular ou computador",
    investmentLevel: "baixo" as const,
    investmentMin: 0,
    timeText: "[__] h por aula",
    difficulty: 2,
    costsText: "Material didático, transporte",
    suggestedPrice: "[R$ __] por hora",
    whereToSell: "Grupos de pais, indicação, escolas",
    mode: "ambos" as const,
    phoneOnly: false,
    requiredEquipment: [],
    scoringSkills: ["ensinar", "escrever"],
    scoringInterests: ["educacao"],
    minHoursPerDay: 10,
    salesIntensity: "baixo" as const,
    status: "published" as const,
    sortOrder: 8,
  },
  {
    slug: "fotos-de-produto",
    title: "Fotos de produto para lojas",
    description: "Fotografar produtos com o celular para lojas venderem pelo Instagram e marketplaces.",
    buyers: "Lojas do bairro e vendedores online.",
    howToFindBuyers: "Lojas do bairro, marketplaces, Instagram.",
    risks: "Precisa de boa luz; concorrência; portfólio é essencial.",
    skillsText: "Fotos, olhar visual",
    equipmentText: "Celular com boa câmera",
    investmentLevel: "baixo" as const,
    investmentMin: 50,
    timeText: "[__] h por sessão",
    difficulty: 2,
    costsText: "Fundo, iluminação simples, transporte",
    suggestedPrice: "[R$ __] por foto ou pacote",
    whereToSell: "Visita a lojas, Instagram",
    mode: "ambos" as const,
    phoneOnly: true,
    requiredEquipment: ["celular"],
    scoringSkills: ["fotos", "design"],
    scoringInterests: ["comercio", "beleza"],
    minHoursPerDay: 10,
    salesIntensity: "medio" as const,
    status: "published" as const,
    sortOrder: 9,
  },
  {
    slug: "revenda",
    title: "Revenda",
    description: "Revender produtos de catálogo ou de fornecedores.",
    buyers: "Rede de contatos.",
    howToFindBuyers: "WhatsApp, indicação.",
    risks: "Estoque parado; margens pequenas; [revisar antes de publicar].",
    skillsText: "Vender",
    equipmentText: "Celular",
    investmentLevel: "medio" as const,
    investmentMin: 300,
    timeText: "[__]",
    difficulty: 2,
    costsText: "Estoque",
    suggestedPrice: "[R$ __]",
    whereToSell: "WhatsApp",
    mode: "ambos" as const,
    phoneOnly: true,
    requiredEquipment: ["celular"],
    scoringSkills: ["vender", "atendimento"],
    scoringInterests: ["comercio"],
    minHoursPerDay: 10,
    salesIntensity: "alto" as const,
    status: "draft" as const,
    sortOrder: 10,
  },
];

/* =====================================================================
 * As 14 etapas e o que desbloqueia cada uma (configurável no admin).
 * ===================================================================== */
export const STAGES: {
  number: number;
  title: string;
  mentor: string;
  description: string;
  unlockStages: number[];
  unlockConditions: UnlockCondition[];
  unlockHint: string;
}[] = [
  { number: 1, title: "Descobrir talentos", mentor: "Bia", description: "Entender o que você já sabe fazer.", unlockStages: [], unlockConditions: [], unlockHint: "Sempre aberta" },
  { number: 2, title: "Escolher oportunidade", mentor: "Caio", description: "Comparar os 3 caminhos e escolher um.", unlockStages: [1], unlockConditions: ["profile_complete"], unlockHint: "Perfil completo" },
  { number: 3, title: "O que vou vender", mentor: "Duda", description: "Definir o produto ou serviço.", unlockStages: [2], unlockConditions: ["opportunity_chosen"], unlockHint: "Oportunidade escolhida" },
  { number: 4, title: "Meus compradores", mentor: "Caio", description: "Escolher um público pequeno e claro.", unlockStages: [3], unlockConditions: [], unlockHint: "Produto definido" },
  { number: 5, title: "Minha oferta", mentor: "Duda", description: "Montar a oferta em poucas frases.", unlockStages: [4], unlockConditions: [], unlockHint: "Compradores definidos" },
  { number: 6, title: "Custos e preço", mentor: "Rosa", description: "Calcular custos e definir o preço.", unlockStages: [5], unlockConditions: [], unlockHint: "Oferta pronta" },
  { number: 7, title: "Materiais comerciais", mentor: "Lia", description: "Criar os textos de venda.", unlockStages: [5, 6], unlockConditions: [], unlockHint: "Oferta e preço" },
  { number: 8, title: "Minha divulgação", mentor: "Lia", description: "Portfólio e canais de divulgação.", unlockStages: [7], unlockConditions: [], unlockHint: "Materiais criados" },
  { number: 9, title: "Achar clientes", mentor: "Nando", description: "Montar a lista e mandar as primeiras mensagens.", unlockStages: [8], unlockConditions: [], unlockHint: "Divulgação pronta" },
  { number: 10, title: "Preparar operação", mentor: "Duda", description: "Rotina, entrega e recebimento.", unlockStages: [6], unlockConditions: [], unlockHint: "Preço definido" },
  { number: 11, title: "Fiscal e jurídico", mentor: "Rosa", description: "Entender obrigações e falar com profissionais.", unlockStages: [10], unlockConditions: [], unlockHint: "Operação pronta" },
  { number: 12, title: "Começar a vender", mentor: "Nando", description: "Primeira proposta e primeira venda.", unlockStages: [7, 9, 11], unlockConditions: [], unlockHint: "Etapas 7, 9 e 11" },
  { number: 13, title: "Acompanhar resultados", mentor: "Rosa", description: "Olhar números e aprender com o mês.", unlockStages: [12], unlockConditions: ["first_sale"], unlockHint: "1ª venda registrada" },
  { number: 14, title: "Evoluir a atividade", mentor: "Caio", description: "Escolher o próximo passo.", unlockStages: [13], unlockConditions: ["records_30_days"], unlockHint: "30 dias de registros" },
];

type MissionSeed = {
  key: string;
  stageNumber: number;
  order: number;
  title: string;
  mentor: string;
  minutes: number;
  points: number;
  objective: string;
  explanation: string;
  example: string;
  tools: string[];
  fields: MissionField[];
  checklist: string[];
  autoKey?: AutoKey;
  dependsOnKey?: string;
};

const t = (key: string, label: string, required = true, placeholder = ""): MissionField => ({ key, label, type: "text", required, placeholder });
const ta = (key: string, label: string, required = true, placeholder = ""): MissionField => ({ key, label, type: "textarea", required, placeholder });
const num = (key: string, label: string, required = true, placeholder = ""): MissionField => ({ key, label, type: "number", required, placeholder });
const sel = (key: string, label: string, options: string[], required = true): MissionField => ({ key, label, type: "select", required, options });

export const MISSIONS: MissionSeed[] = [
  // 1 · Descobrir talentos
  { key: "questionario", stageNumber: 1, order: 1, title: "Responder o questionário de talentos", mentor: "Bia", minutes: 5, points: 50, objective: "Contar sobre você: talentos, tempo, recursos e orçamento.", explanation: "É com essas respostas que a Bia e o Caio escolhem as oportunidades que combinam com você. Esta missão é concluída automaticamente quando você termina o questionário.", example: "", tools: [], fields: [], checklist: [], autoKey: "profile_complete" },
  { key: "retrato", stageNumber: 1, order: 2, title: "Confirmar meu retrato", mentor: "Bia", minutes: 5, points: 30, objective: "Olhar seu perfil de talentos e escolher a habilidade que você mais gosta de usar.", explanation: "Às vezes a gente esquece de algo que faz bem. Revise o perfil e, se lembrar de mais alguma coisa, edite: a Bia refaz as contas.", example: "Gosto mais de mexer com fotos do que com planilhas.", tools: ["Meu perfil de talentos"], fields: [ta("forca", "Qual habilidade você mais gosta de usar? Por quê?")], checklist: ["Revisei meu perfil de talentos"] },
  // 2 · Escolher oportunidade
  { key: "comparar", stageNumber: 2, order: 1, title: "Comparar meus 3 caminhos", mentor: "Caio", minutes: 10, points: 40, objective: "Ler os prós, riscos e limites de cada oportunidade.", explanation: "Nenhuma oportunidade é perfeita. Olhe com calma o que cada uma pede de tempo, dinheiro e equipamento.", example: "Vídeos curtos combina com meu celular, mas tem muita concorrência.", tools: ["Minhas oportunidades"], fields: [ta("pesou", "O que mais pesou na sua escolha?")], checklist: ["Li os prós de cada caminho", "Li os riscos e limites"] },
  { key: "escolher", stageNumber: 2, order: 2, title: "Escolher meu caminho", mentor: "Caio", minutes: 2, points: 80, objective: "Escolher uma das 3 oportunidades para começar.", explanation: "Escolha em Minhas oportunidades. Dá para trocar depois, sem perder o que fez.", example: "", tools: ["Minhas oportunidades"], fields: [], checklist: [], autoKey: "opportunity_chosen" },
  // 3 · O que vou vender
  { key: "produto", stageNumber: 3, order: 1, title: "O que você vende", mentor: "Duda", minutes: 10, points: 50, objective: "Definir, em uma frase, o que você vai vender.", explanation: "Quanto mais simples, mais fácil de explicar. Comece com um produto ou serviço só.", example: "4 vídeos curtos por mês para o Instagram.", tools: [], fields: [t("produto", "Em uma frase, o que você vai vender?", true, "Ex.: 4 vídeos curtos por mês"), sel("formato", "Formato", ["Serviço avulso", "Pacote mensal", "Produto por encomenda"])], checklist: [] },
  { key: "entrega", stageNumber: 3, order: 2, title: "Como é a entrega", mentor: "Duda", minutes: 10, points: 50, objective: "Explicar como o cliente recebe o que comprou.", explanation: "Pense no passo a passo: o cliente pede, você faz, entrega e recebe.", example: "Gravo no salão, edito em casa e envio pelo WhatsApp em até 3 dias.", tools: [], fields: [ta("como", "Como o cliente recebe?"), t("prazo", "Em quanto tempo você entrega?", true, "Ex.: até 3 dias")], checklist: [], dependsOnKey: "produto" },
  // 4 · Meus compradores
  { key: "publico", stageNumber: 4, order: 1, title: "Para quem você vai vender?", mentor: "Caio", minutes: 10, points: 50, objective: "Escolher um público pequeno e claro para começar.", explanation: "Um público bom para começar tem dinheiro para pagar, você consegue falar com ele e ele precisa do que você faz.", example: "Confeiteiras do bairro que precisam de vídeos para o Instagram.", tools: ["Instagram", "Google Maps"], fields: [t("publico", "Seu público", true, "Ex.: salões de beleza da minha cidade")], checklist: ["Tem dinheiro para pagar", "Eu consigo falar com eles", "Precisa do que eu faço"] },
  { key: "onde-estao", stageNumber: 4, order: 2, title: "Onde estão seus compradores", mentor: "Caio", minutes: 15, points: 50, objective: "Listar onde encontrar o seu público e 5 nomes que você já conhece.", explanation: "Comece por quem já te conhece. Indicação é o caminho mais curto para o primeiro cliente.", example: "Instagram do bairro; Salão Aurora, Studio Bela, Espaço Nina…", tools: ["Instagram", "Google Maps", "Grupos do bairro"], fields: [ta("onde", "Onde seu público está?"), ta("nomes", "5 pessoas ou negócios que você já conhece")], checklist: [], dependsOnKey: "publico" },
  // 5 · Minha oferta
  { key: "oferta", stageNumber: 5, order: 1, title: "Monte sua oferta em 3 frases", mentor: "Duda", minutes: 15, points: 50, objective: "Responder: o que entrega, para quem e que resultado a pessoa ganha.", explanation: "Uma oferta clara responde às 3 perguntas sem enrolação. A Lia usa estas respostas para escrever seus textos de venda.", example: "4 vídeos por mês para salões do bairro mostrarem seus trabalhos.", tools: [], fields: [t("o_que", "O que você entrega?"), t("para_quem", "Para quem?"), t("resultado", "Que resultado a pessoa ganha?")], checklist: [] },
  { key: "diferencial", stageNumber: 5, order: 2, title: "Seu diferencial", mentor: "Duda", minutes: 10, points: 50, objective: "Dizer por que escolher você.", explanation: "Diferencial não precisa ser algo inédito: pode ser rapidez, atendimento, conhecer o bairro ou um estilo.", example: "Entrego em 3 dias e conheço os salões da região.", tools: [], fields: [ta("diferencial", "Por que escolher você?")], checklist: ["É algo que eu consigo cumprir sempre"], dependsOnKey: "oferta" },
  { key: "garantia", stageNumber: 5, order: 3, title: "Combine as regras", mentor: "Duda", minutes: 5, points: 40, objective: "Definir prazo e quantos ajustes estão inclusos.", explanation: "Regras claras evitam mal-entendidos e trabalho sem fim.", example: "Prazo de 3 dias; 1 ajuste incluso.", tools: [], fields: [t("prazo", "Prazo de entrega"), t("ajustes", "Ajustes inclusos", true, "Ex.: 1")], checklist: [] },
  // 6 · Custos e preço
  { key: "custos", stageNumber: 6, order: 1, title: "Liste seus custos", mentor: "Rosa", minutes: 15, points: 50, objective: "Saber quanto custa cada entrega e quanto você gasta por mês.", explanation: "Custo é tudo que sai do seu bolso para entregar: material, transporte, aplicativos, internet.", example: "R$ 5 de transporte por entrega; R$ 35 por mês de aplicativo.", tools: ["Financeiro"], fields: [num("custo_entrega", "Custo por entrega (R$)"), num("custo_mes", "Custos fixos por mês (R$)"), num("horas", "Horas de trabalho por entrega")], checklist: [] },
  { key: "preco", stageNumber: 6, order: 2, title: "Calcule seu preço", mentor: "Rosa", minutes: 15, points: 60, objective: "Definir um preço que cubra seus custos e pague seu tempo.", explanation: "Uma conta simples: (valor da sua hora × horas) + custo por entrega + uma parte dos custos fixos. Depois compare com 3 concorrentes. A conta é um ponto de partida, não uma regra.", example: "(R$ 25 × 2h) + R$ 5 + R$ 10 = R$ 65 por vídeo.", tools: ["Calculadora"], fields: [num("valor_hora", "Quanto quer ganhar por hora (R$)"), num("preco", "Seu preço final (R$)")], checklist: ["Comparei com 3 concorrentes", "O preço cobre meus custos"], dependsOnKey: "custos" },
  // 7 · Materiais comerciais
  { key: "material-whatsapp", stageNumber: 7, order: 1, title: "Gere seu primeiro material", mentor: "Lia", minutes: 5, points: 50, objective: "Criar e salvar um material em Materiais de venda.", explanation: "A Lia escreve com base na sua oferta. Você revisa, ajusta e salva. Esta missão conclui sozinha ao salvar.", example: "", tools: ["Materiais de venda"], fields: [], checklist: [], autoKey: "first_material" },
  { key: "material-revisar", stageNumber: 7, order: 2, title: "Revise seus textos", mentor: "Lia", minutes: 15, points: 50, objective: "Deixar descrição, oferta e mensagem com a sua cara.", explanation: "Texto bom é o que soa como você. Troque palavras, encurte e leia em voz alta.", example: "", tools: ["Materiais de venda"], fields: [], checklist: ["Revisei a descrição", "Revisei a oferta", "Ajustei o tom da mensagem"] },
  // 8 · Minha divulgação
  { key: "portfolio", stageNumber: 8, order: 1, title: "Monte um portfólio simples", mentor: "Lia", minutes: 30, points: 60, objective: "Ter 3 exemplos do seu trabalho para mostrar.", explanation: "Sem cliente ainda? Faça exemplos para amigos ou para você mesma(o). Peça autorização antes de mostrar trabalho de outras pessoas.", example: "3 vídeos feitos para a loja de uma amiga.", tools: ["Instagram", "Google Drive"], fields: [t("link", "Link do portfólio (opcional)", false)], checklist: ["Separei 3 exemplos do meu trabalho", "Pedi autorização para mostrar"] },
  { key: "canais", stageNumber: 8, order: 2, title: "Escolha onde divulgar", mentor: "Lia", minutes: 10, points: 40, objective: "Escolher 1 canal principal e com que frequência vai postar.", explanation: "Melhor um canal bem cuidado do que cinco abandonados.", example: "Instagram, 3 posts por semana.", tools: [], fields: [sel("canal", "Canal principal", ["Instagram", "WhatsApp Status", "Grupos do bairro", "Indicação", "Feiras"]), t("frequencia", "Com que frequência?")], checklist: [] },
  // 9 · Achar clientes
  { key: "lista-clientes", stageNumber: 9, order: 1, title: "Cadastre seu primeiro contato", mentor: "Nando", minutes: 5, points: 50, objective: "Colocar um possível cliente no quadro Meus clientes.", explanation: "Conclui sozinha quando você cadastra o primeiro contato.", example: "", tools: ["Meus clientes"], fields: [], checklist: [], autoKey: "first_client" },
  { key: "primeira-mensagem", stageNumber: 9, order: 2, title: "Mande sua primeira mensagem", mentor: "Nando", minutes: 20, points: 80, objective: "Apresentar seu trabalho para 3 pessoas.", explanation: "A Lia já deixou o texto pronto. Quem envia é você, do seu WhatsApp: a plataforma nunca manda mensagem sozinha.", example: "", tools: ["Materiais de venda", "Meus clientes"], fields: [ta("como_foi", "Como foi? O que responderam?", false)], checklist: ["Escolhi 3 pessoas", "Enviei a mensagem", "Anotei as respostas no quadro"] },
  // 10 · Preparar operação
  { key: "rotina", stageNumber: 10, order: 1, title: "Organize sua rotina", mentor: "Duda", minutes: 10, points: 40, objective: "Reservar dias e horários fixos para o negócio.", explanation: "Mesmo 1 hora por dia rende se for todo dia no mesmo horário.", example: "Seg, qua e sex, das 20h às 21h.", tools: [], fields: [t("dias", "Quais dias?"), t("horario", "Qual horário?")], checklist: [] },
  { key: "operacao", stageNumber: 10, order: 2, title: "Checklist de operação", mentor: "Duda", minutes: 10, points: 40, objective: "Garantir que dá para entregar e receber.", explanation: "Antes de vender, confira se você consegue entregar e receber sem aperto.", example: "", tools: ["Financeiro"], fields: [], checklist: ["Sei quanto tempo leva cada entrega", "Tenho como receber (Pix ou outra forma)", "Separei dinheiro pessoal e do negócio"] },
  // 11 · Fiscal e jurídico
  { key: "ler-guias", stageNumber: 11, order: 1, title: "Entenda o que se aplica a você", mentor: "Rosa", minutes: 15, points: 40, objective: "Ler os guias publicados em Organize seu negócio.", explanation: "Os guias são informativos e mostram a fonte oficial. Eles não substituem contador nem advogado: cada atividade tem regras próprias.", example: "", tools: ["Organize seu negócio"], fields: [], checklist: ["Li os guias disponíveis", "Anotei minhas dúvidas"] },
  { key: "contador", stageNumber: 11, order: 2, title: "Converse com um contador", mentor: "Rosa", minutes: 30, points: 80, objective: "Você está se preparando para começar a vender. Agora é importante entender quais obrigações se aplicam à sua atividade. Sua próxima missão é conversar com um contador.", explanation: "A plataforma ajuda a preparar as perguntas e organizar os documentos. A orientação sobre formalização, impostos e notas fiscais deve vir de um profissional habilitado (contador com CRC ativo).", example: "Que enquadramento serve para minha atividade? Preciso emitir nota fiscal? Que impostos pago e quando?", tools: ["Roteiro da consulta (baixar)", "Organize seu negócio"], fields: [ta("perguntas", "Suas perguntas para o contador"), t("quando", "Quando vai ser a conversa?", false)], checklist: ["Baixei o roteiro da consulta", "Separei meus documentos", "Marquei a conversa"] },
  // 12 · Começar a vender
  { key: "proposta", stageNumber: 12, order: 1, title: "Envie sua primeira proposta", mentor: "Nando", minutes: 15, points: 60, objective: "Mandar um orçamento para quem demonstrou interesse.", explanation: "Use o modelo de Orçamento e proposta em Materiais. Registre o envio na ficha do cliente.", example: "", tools: ["Materiais de venda", "Meus clientes"], fields: [], checklist: ["Escolhi um cliente interessado", "Enviei a proposta", "Marquei a próxima ação na ficha"] },
  { key: "primeira-venda", stageNumber: 12, order: 2, title: "Registre sua primeira venda", mentor: "Rosa", minutes: 2, points: 100, objective: "Lançar a primeira venda no Financeiro.", explanation: "Conclui sozinha quando você registra uma venda.", example: "", tools: ["Financeiro"], fields: [], checklist: [], autoKey: "first_sale" },
  // 13 · Acompanhar resultados
  { key: "revisao-mes", stageNumber: 13, order: 1, title: "Faça a revisão do mês", mentor: "Rosa", minutes: 15, points: 60, objective: "Olhar vendido, recebido e lucro estimado e tirar uma lição.", explanation: "Lucro estimado = recebido − custos. Confira sempre com seu extrato.", example: "", tools: ["Financeiro"], fields: [ta("aprendi", "O que você aprendeu este mês?"), ta("melhorar", "O que vai fazer diferente?")], checklist: [] },
  { key: "depoimento", stageNumber: 13, order: 2, title: "Peça um depoimento", mentor: "Nando", minutes: 10, points: 40, objective: "Pedir a um cliente satisfeito um depoimento ou indicação.", explanation: "Depoimento ajuda o próximo cliente a confiar em você. Peça autorização para publicar.", example: "", tools: ["Meus clientes"], fields: [], checklist: ["Pedi um depoimento", "Pedi autorização para publicar"] },
  // 14 · Evoluir a atividade
  { key: "proximo-passo", stageNumber: 14, order: 1, title: "Escolha seu próximo passo", mentor: "Caio", minutes: 15, points: 60, objective: "Decidir como evoluir a atividade.", explanation: "Com 30 dias de registros dá para decidir com base em números, não em achismo.", example: "", tools: ["Financeiro", "Conteúdos"], fields: [sel("passo", "Próximo passo", ["Ajustar o preço", "Criar um pacote", "Buscar um novo público", "Testar outra oportunidade"]), ta("plano", "Como vai fazer?")], checklist: [] },
  { key: "meta-3-meses", stageNumber: 14, order: 2, title: "Defina a meta dos próximos 3 meses", mentor: "Rosa", minutes: 10, points: 40, objective: "Escolher uma meta realista e acompanhável.", explanation: "Meta boa é a que depende das suas ações: número de contatos, de propostas, de entregas.", example: "Mandar 10 propostas por mês.", tools: [], fields: [t("meta", "Sua meta")], checklist: [] },
];

export const BADGES = [
  { key: "comecei", name: "Comecei!", emoji: "🚀", description: "Assinatura confirmada.", rule: "subscribed", points: 20, sortOrder: 1 },
  { key: "talento", name: "Talento achado", emoji: "💡", description: "Questionário de talentos completo.", rule: "profile_complete", points: 20, sortOrder: 2 },
  { key: "caminho", name: "Caminho escolhido", emoji: "🧭", description: "Escolheu uma oportunidade.", rule: "opportunity_chosen", points: 20, sortOrder: 3 },
  { key: "publico", name: "Público definido", emoji: "🎯", description: "Definiu para quem vai vender.", rule: "mission:publico", points: 20, sortOrder: 4 },
  { key: "preco", name: "Preço calculado", emoji: "🏷️", description: "Concluiu a etapa de custos e preço.", rule: "stage:6", points: 30, sortOrder: 5 },
  { key: "material", name: "1º material", emoji: "✍️", description: "Salvou o primeiro material de venda.", rule: "first_material", points: 10, sortOrder: 6 },
  { key: "mensagem", name: "1ª mensagem", emoji: "💬", description: "Mandou as primeiras mensagens.", rule: "mission:primeira-mensagem", points: 30, sortOrder: 7 },
  { key: "cliente", name: "1º cliente", emoji: "🤝", description: "Cadastrou o primeiro cliente.", rule: "first_client", points: 20, sortOrder: 8 },
  { key: "venda", name: "1ª venda", emoji: "💰", description: "Registrou a primeira venda.", rule: "first_sale", points: 50, sortOrder: 9 },
  { key: "jornada", name: "Jornada completa", emoji: "🏆", description: "Concluiu as 14 etapas.", rule: "stage:14", points: 100, sortOrder: 10 },
];

/* =====================================================================
 * Conteúdo contínuo (personalizado por etapa e oportunidade).
 * ===================================================================== */
type ContentSeed = {
  slug: string;
  title: string;
  category: ContentCategory;
  kind?: "article" | "challenge";
  minutes: number;
  minStage: number;
  maxStage: number;
  opportunitySlug?: string;
  challengeGoal?: number;
  challengePoints?: number;
  body: string;
};

export const CONTENTS: ContentSeed[] = [
  { slug: "desafio-3-mensagens", title: "Mande 3 mensagens de apresentação até domingo", category: "vendas", kind: "challenge", minutes: 5, minStage: 7, maxStage: 14, challengeGoal: 3, challengePoints: 30, body: "A Lia já deixou o texto pronto em Materiais de venda. Você só escolhe para quem.\n\nMarque +1 a cada mensagem enviada. Quem envia é você, do seu WhatsApp." },
  { slug: "desafio-talentos", title: "Pergunte a 3 pessoas no que você é boa(bom)", category: "melhorias", kind: "challenge", minutes: 5, minStage: 1, maxStage: 3, challengeGoal: 3, challengePoints: 20, body: "Às vezes os outros enxergam nosso talento antes da gente. Pergunte a 3 pessoas de confiança: “Em que você me pediria ajuda?”. Anote as respostas no seu perfil de talentos." },
  { slug: "desafio-portfolio", title: "Faça 2 exemplos para o seu portfólio", category: "divulgacao", kind: "challenge", minutes: 5, minStage: 5, maxStage: 9, challengeGoal: 2, challengePoints: 30, body: "Sem cliente ainda? Crie dois exemplos para amigos ou para você. Marque +1 a cada exemplo pronto." },
  { slug: "responder-ta-caro", title: "Como responder “tá caro”", category: "vendas", minutes: 3, minStage: 6, maxStage: 14, body: "“Tá caro” quase nunca é só sobre dinheiro. Muitas vezes a pessoa ainda não entendeu o que está incluso.\n\n1. Agradeça e pergunte: “Comparado com o quê?”\n2. Relembre o que está incluso: prazo, ajustes, atendimento.\n3. Ofereça uma versão menor, não um desconto: menos itens por um valor menor.\n4. Se mesmo assim não fechar, tudo bem. Anote no quadro e tente de novo daqui a alguns meses." },
  { slug: "pacote-ou-avulso", title: "Pacote mensal ou serviço avulso?", category: "preco", minutes: 4, minStage: 5, maxStage: 14, body: "Avulso é bom para o cliente experimentar. Pacote mensal dá previsibilidade para você.\n\nUma estratégia comum: ofereça o primeiro serviço avulso e, se o cliente gostar, apresente o pacote com um valor por unidade um pouco menor. Lembre de colocar no preço o tempo de conversa e de ajustes." },
  { slug: "separar-pessoal-negocio", title: "Separar o dinheiro pessoal do negócio", category: "dinheiro", minutes: 3, minStage: 6, maxStage: 14, body: "Misturar as contas é o jeito mais rápido de achar que está tendo lucro quando não está.\n\n- Use uma conta ou carteira digital só para o negócio.\n- Registre toda venda e todo custo no Financeiro.\n- Defina um “salário” para você e transfira só esse valor para a conta pessoal.\n\nPara questões fiscais da sua atividade, converse com um contador." },
  { slug: "portfolio-em-uma-tarde", title: "Montar um portfólio em 1 tarde", category: "divulgacao", minutes: 2, minStage: 7, maxStage: 14, body: "1. Escolha 3 trabalhos que você mais gosta.\n2. Mostre o antes e depois, quando fizer sentido.\n3. Escreva uma frase sobre cada um: para quem foi e qual o resultado.\n4. Junte tudo num destaque do Instagram ou numa pasta compartilhada.\n\nPeça autorização antes de mostrar trabalhos feitos para outras pessoas." },
  { slug: "primeira-mensagem-sem-vergonha", title: "Primeira mensagem sem vergonha", category: "vendas", minutes: 3, minStage: 7, maxStage: 12, body: "Vergonha de oferecer é normal. Três ideias para destravar:\n\n- Comece por quem já te conhece.\n- Ofereça ajuda, não “venda”: “Posso te mostrar uns exemplos?”\n- Use o texto pronto da Lia e ajuste uma palavra para ficar com a sua cara.\n\nUm “não” hoje não é um “não” para sempre." },
  { slug: "atendimento-que-fideliza", title: "Atendimento que traz o cliente de volta", category: "atendimento", minutes: 3, minStage: 9, maxStage: 14, body: "Responda no mesmo dia, mesmo que seja para dizer “vejo isso amanhã cedo”. Confirme o pedido por escrito. Depois da entrega, pergunte se ficou bom. Esses três hábitos simples fazem muita diferença." },
  { slug: "rotina-de-1-hora", title: "Como render com 1 hora por dia", category: "produtividade", minutes: 3, minStage: 1, maxStage: 14, body: "Divida a hora em três blocos: 20 minutos para produzir, 20 para divulgar e 20 para responder clientes e registrar no Financeiro. Use o mesmo horário todos os dias. Pausou uns dias? Tudo bem: seu progresso fica guardado." },
  { slug: "onde-achar-clientes", title: "5 lugares para achar os primeiros clientes", category: "clientes", minutes: 4, minStage: 4, maxStage: 12, body: "1. Sua lista de contatos do celular.\n2. Grupos do bairro e do condomínio.\n3. Comércios que você já frequenta.\n4. Indicação de amigos e família.\n5. Perfis locais no Instagram.\n\nCadastre cada contato em Meus clientes e marque a próxima ação." },
  { slug: "calculo-preco-simples", title: "A conta do preço, sem mistério", category: "preco", minutes: 4, minStage: 5, maxStage: 8, body: "Preço = (valor da sua hora × horas) + custos da entrega + parte dos custos fixos.\n\nDepois compare com o mercado. Se ficar muito acima, veja onde dá para ganhar tempo. Se ficar muito abaixo, você pode estar cobrando pouco pelo seu trabalho." },
  { slug: "faturamento-receita-lucro", title: "Faturamento, receita e lucro: qual a diferença?", category: "dinheiro", minutes: 3, minStage: 10, maxStage: 14, body: "Faturamento: tudo o que você vendeu, recebido ou não.\nReceita: o dinheiro que já entrou.\nLucro estimado: o que entrou menos custos e despesas.\n\nO painel Financeiro mostra os três separados para você nunca confundir." },
  { slug: "melhorar-depois-30-dias", title: "O que olhar depois de 30 dias", category: "melhorias", minutes: 4, minStage: 13, maxStage: 14, body: "Quantos contatos viraram clientes? Qual serviço deu mais lucro? Quanto tempo você gastou por entrega? Com essas três respostas dá para decidir se ajusta o preço, cria um pacote ou muda de público." },
  { slug: "videos-ganchos", title: "3 ganchos para vídeos de salão", category: "divulgacao", minutes: 2, minStage: 3, maxStage: 14, opportunitySlug: "videos-curtos", body: "1. Comece pelo resultado: o cabelo pronto nos 2 primeiros segundos.\n2. Mostre o antes e depois com um corte rápido.\n3. Termine com o nome do salão e um convite: “Agende pelo direct”." },
  { slug: "doces-rotulagem", title: "Antes de vender comida: o que perguntar", category: "melhorias", minutes: 3, minStage: 3, maxStage: 14, opportunitySlug: "doces-por-encomenda", body: "Venda de alimentos tem regras sanitárias e de rotulagem que variam por município e por tipo de produto. Antes de começar, procure a vigilância sanitária da sua cidade e converse com um contador. Leve a lista de produtos que pretende vender." },
];

/* =====================================================================
 * Guias jurídicos e contábeis. NENHUM vem publicado: precisam de fonte,
 * data e revisão de profissional habilitado (contador/advogado).
 * ===================================================================== */
export const LEGAL_CONTENTS = [
  { slug: "mei-o-que-e", title: "MEI: o que é e quando pode fazer sentido", area: "contabil" as const, status: "in_review" as const, sourceUrl: "https://www.gov.br/empresas-e-negocios/pt-br/empreendedor", sourceCheckedAt: null, summary: "O MEI é uma das formas de formalizar um pequeno negócio. Se serve para você depende da sua atividade e de quanto fatura.", body: "O Microempreendedor Individual (MEI) é uma das formas de formalizar um pequeno negócio no Brasil.\n\nNem toda atividade pode ser MEI, e existe um limite de faturamento anual que muda de tempos em tempos. Por isso, confira sempre as regras atuais no portal oficial do governo.\n\nPontos para levar ao contador:\n- Minha atividade pode ser MEI?\n- Qual é o limite de faturamento hoje?\n- Que contribuição mensal eu pago e o que ela garante?\n\nConteúdo informativo. Não é parecer contábil ou jurídico.", sortOrder: 1 },
  { slug: "notas-fiscais", title: "Nota fiscal de serviço", area: "contabil" as const, status: "in_review" as const, sourceUrl: "https://www.gov.br/nfse/pt-br", sourceCheckedAt: null, summary: "Quando e como emitir nota fiscal depende da sua formalização, do tipo de cliente e da sua cidade.", body: "A obrigação de emitir nota fiscal depende de como você está formalizada(o), de para quem vende (pessoa física ou empresa) e das regras do seu município.\n\nPergunte ao contador:\n- Preciso emitir nota para este tipo de cliente?\n- Onde e como emito?\n\nConteúdo informativo. Não é parecer contábil ou jurídico.", sortOrder: 2 },
  { slug: "pessoal-x-negocio", title: "Dinheiro pessoal x negócio", area: "contabil" as const, status: "draft" as const, sourceUrl: "", sourceCheckedAt: null, summary: "Separar as contas ajuda a saber se o negócio dá lucro.", body: "Separar o dinheiro pessoal do dinheiro do negócio ajuda a enxergar se a atividade está dando resultado.\n\n[Texto em elaboração — aguardando fonte e revisão.]", sortOrder: 3 },
  { slug: "direitos-do-consumidor", title: "Direitos do consumidor", area: "juridico" as const, status: "draft" as const, sourceUrl: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm", sourceCheckedAt: null, summary: "Quem vende para consumidores precisa respeitar o Código de Defesa do Consumidor.", body: "Quem vende produtos ou serviços para consumidores precisa respeitar o Código de Defesa do Consumidor (Lei nº 8.078/1990): informação clara de preço e condições, prazos de entrega e regras para troca e arrependimento em compras fora do estabelecimento.\n\nPergunte ao advogado como isso se aplica à sua atividade.\n\nConteúdo informativo. Não é parecer jurídico.", sortOrder: 4 },
  { slug: "protecao-de-dados", title: "Proteção de dados dos seus clientes", area: "juridico" as const, status: "draft" as const, sourceUrl: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm", sourceCheckedAt: null, summary: "Guardar contatos de clientes exige cuidado com a LGPD.", body: "Ao guardar nome, telefone e informações de clientes, você trata dados pessoais. A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) pede, entre outras coisas, que você use os dados só para a finalidade combinada e os guarde com segurança.\n\nConteúdo informativo. Não é parecer jurídico.", sortOrder: 5 },
  { slug: "contratos", title: "Contratos simples de prestação de serviço", area: "juridico" as const, status: "draft" as const, sourceUrl: "", sourceCheckedAt: null, summary: "Em breve.", body: "[Em breve — aguardando redação e revisão de advogado.]", sortOrder: 6 },
  { slug: "quando-procurar-profissional", title: "Quando procurar contador ou advogado", area: "contabil" as const, status: "draft" as const, sourceUrl: "", sourceCheckedAt: null, summary: "Sinais de que é hora de buscar orientação profissional.", body: "Procure um contador antes de começar a vender com frequência, ao pensar em formalizar, ao receber de empresas ou quando tiver dúvida sobre impostos.\n\nProcure um advogado para contratos, problemas com clientes, uso de marca ou dúvidas sobre direitos.\n\nO Vira Renda ajuda a preparar as perguntas, mas não substitui esses profissionais.", sortOrder: 7 },
];

export const PLANS = [
  { slug: "mensal", name: "Plano Vira Renda · mensal", intervalMonths: 1, firstPeriodPriceCents: 2990, priceCents: 6990, active: true, sortOrder: 1 },
  // Preparados conforme o briefing; ficam inativos até o negócio definir preços (sugestão do documento: anual com desconto após dados de retenção).
  { slug: "trimestral", name: "Plano Vira Renda · trimestral", intervalMonths: 3, firstPeriodPriceCents: null, priceCents: 18900, active: false, sortOrder: 2 },
  { slug: "semestral", name: "Plano Vira Renda · semestral", intervalMonths: 6, firstPeriodPriceCents: null, priceCents: 35900, active: false, sortOrder: 3 },
  { slug: "anual", name: "Plano Vira Renda · anual", intervalMonths: 12, firstPeriodPriceCents: null, priceCents: 65900, active: false, sortOrder: 4 },
];
