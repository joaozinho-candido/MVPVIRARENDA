import { config } from "@/lib/config";

const s = config.support;

/** RASCUNHOS para revisão de advogado antes do lançamento. Não afirmam conformidade jurídica completa. */
export const LEGAL_DOCS = [
  {
    kind: "privacy" as const,
    version: "1.0",
    title: "Política de Privacidade",
    summary:
      "Coletamos só o necessário para o Vira Renda funcionar: seus dados de conta, suas respostas e o que você registra na plataforma. Não vendemos seus dados. Você pode baixar ou excluir tudo quando quiser, direto no seu perfil.",
    body: `## 1. Quem somos
${s.company}, CNPJ ${s.cnpj} ("Vira Renda"), é a controladora dos dados tratados nesta plataforma.

## 2. Dados que coletamos
- Conta: nome, e-mail e senha (guardada de forma cifrada, nunca em texto).
- Questionário de talentos: habilidades, interesses, experiências, tempo, equipamentos, orçamento, preferências e meta (opcional).
- O que você registra: respostas das missões, materiais, clientes, lançamentos financeiros.
- Assinatura: plano, status e histórico de pagamentos. Dados de cartão são tratados pelo gateway de pagamento; guardamos apenas os 4 últimos dígitos.
- Uso: datas de acesso e atividades na plataforma, para mostrar seu progresso.
- Cookies essenciais (sessão de login) e, só se você permitir, cookies de medição.

## 3. Para que usamos
- Prestar o serviço: recomendar oportunidades, montar sua jornada e guardar seu progresso.
- Cobrança da assinatura e e-mails obrigatórios sobre ela.
- Segurança da conta e prevenção a fraudes.
- Dicas e novidades por e-mail, somente com seu consentimento.

[Bases legais de cada finalidade a serem definidas pelo advogado.]

## 4. Com quem compartilhamos
- Gateway de pagamento [nome a definir], para processar cobranças.
- Provedores de hospedagem, banco de dados e envio de e-mails [nomes a definir].
Não vendemos seus dados.

## 5. Seus direitos
Você pode, a qualquer momento: acessar e baixar seus dados (Perfil › Privacidade › Baixar meus dados), corrigir informações, revogar consentimentos opcionais e excluir sua conta (Perfil › Privacidade › Excluir minha conta).

## 6. Fale com o encarregado
Encarregado de dados (DPO): [nome] · ${s.dpoEmail}

[Prazos de retenção, transferência internacional e demais cláusulas: pendentes de revisão jurídica.]`,
  },
  {
    kind: "terms" as const,
    version: "1.0",
    title: "Termos de Uso",
    summary:
      "O Vira Renda ajuda você a descobrir e organizar uma renda extra. Não prometemos ganhos: o resultado depende de você e do mercado. Os mentores são IA, o suporte é humano e você pode cancelar quando quiser.",
    body: `## 1. O que é o Vira Renda
Uma plataforma de orientação para quem quer transformar talentos em renda extra, com questionário, recomendações, missões, materiais e organização de clientes e finanças.

## 2. O que não fazemos
- Não prometemos ganhos nem resultados financeiros.
- Não fazemos o trabalho no seu lugar.
- Não substituímos contador nem advogado. Conteúdos sobre impostos, formalização e direitos são informativos.
- Não enviamos mensagens a seus clientes sem você.

## 3. Mentores e IA
Os mentores (Bia, Caio, Duda, Lia, Nando e Rosa) são assistentes automatizados e isso é sempre identificado. O suporte da conta é feito por pessoas: ${s.email}.

## 4. Assinatura, cobrança e cancelamento
- Plano mensal com 1º mês promocional e mensalidade a partir do 2º mês, nos valores exibidos no checkout.
- Avisamos por e-mail antes da 2ª cobrança.
- Cancelamento sem multa, a qualquer momento, em Perfil › Meu plano. O acesso continua até o fim do período já pago.
- Se uma cobrança falhar, avisamos e o acesso pode ser pausado após [X] dias. Seu progresso não é apagado.
- [Política de reembolso e direito de arrependimento: a definir com advogado.]

## 5. Sua conta
Você é responsável por manter sua senha em segurança e pelas informações que registra.

## 6. Alterações
Mudanças nestes termos serão avisadas com antecedência. Cada aceite fica registrado com data e versão.

[Foro, limitação de responsabilidade e demais cláusulas: pendentes de revisão jurídica.]`,
  },
  {
    kind: "cookies" as const,
    version: "1.0",
    title: "Política de Cookies",
    summary: "Usamos cookies essenciais para manter você conectada(o) e, se você deixar, cookies de medição para melhorar o site.",
    body: `## Cookies essenciais
- vr_session: mantém seu login (expira em ${config.sessionDays} dias ou ao sair).
- vr_cookie_consent: guarda sua escolha sobre cookies.

## Cookies de medição (opcionais)
Só são usados se você clicar em "Aceitar". [Ferramenta de medição a definir; nenhuma está ativa nesta versão.]

Você pode mudar sua escolha a qualquer momento no rodapé do site.`,
  },
];
