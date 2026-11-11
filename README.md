# Vira Renda · MVP

Plataforma que ajuda pessoas a transformar talentos em renda extra: questionário de talentos, recomendação de oportunidades com compatibilidade, jornada de 14 etapas com missões e comemorações, materiais de venda, CRM, painel financeiro, orientação jurídica/contábil com revisão profissional, assinatura mensal e painel administrativo.

Construído a partir do documento de produto “Vira Renda · Produto completo” (novembro de 2026) e do briefing enviado.

> **Estado:** MVP funcional (não é só interface). Os pagamentos estão em **modo demonstração**: nenhuma cobrança real é feita. Textos legais são **rascunhos para revisão de advogado**. Veja “Pendências” no fim.

---

## Sumário

1. [Stack e arquitetura](#stack-e-arquitetura)
2. [Instalação](#instalação)
3. [Configuração e variáveis de ambiente](#configuração-e-variáveis-de-ambiente)
4. [Banco de dados](#banco-de-dados)
5. [Execução](#execução)
6. [Contas de demonstração](#contas-de-demonstração)
7. [Testes](#testes)
8. [Pagamentos (gateway, webhooks, ciclo mensal)](#pagamentos)
9. [Publicação](#publicação)
10. [Mapa de telas](#mapa-de-telas)
11. [Entrega: o que está pronto, o que é demonstrativo e o que falta](#entrega)

---

## Stack e arquitetura

| Camada | Escolha |
| --- | --- |
| Front e back | **Next.js 15** (App Router, Server Components e Server Actions), **React 19**, **TypeScript** |
| Estilo | **Tailwind CSS 3**, paleta e componentes do documento (Verde Vira, Verde Noite, Amarelo Sol, Coral Festa, Areia; Bricolage Grotesque + Inter) |
| Banco | **Postgres** via **Drizzle ORM**. Em produção: Supabase (ou qualquer Postgres) por `DATABASE_URL`. Em desenvolvimento e testes: **PGlite** (Postgres embutido, sem instalar nada) |
| Autenticação | Própria: senha com bcrypt, sessão em cookie `httpOnly` com token aleatório guardado como hash SHA-256 no banco, tokens de uso único para confirmação de e-mail e recuperação de senha, limite de tentativas de login |
| Validação | Zod + validações próprias (Luhn, CPF, validade do cartão) |
| Testes | **Vitest** (serviços/regras, 49 testes) e **Playwright** (fluxos completos em celular e computador, 24 execuções) |

```
src/
  app/                 Rotas (Next.js)
    (site)/            Site público: início, planos, questionário, termos, privacidade, cookies
    (auth)/            Cadastro, entrar, recuperar/redefinir senha, confirmar e-mail
    assinar/           Checkout e estados do pagamento
    app/               Área do usuário (jornada, oportunidades, missões, materiais, clientes, financeiro…)
    admin/             Painel administrativo (protegido por papel)
    api/               Webhook de pagamento, cron de cobrança, exportações (LGPD, CSV, roteiro)
    actions/           Server Actions: camada fina que checa sessão/papel e chama os serviços
    dev/emails/        Caixa de e-mails de desenvolvimento (desligada em produção)
  server/              Regras de negócio (testáveis sem Next.js)
    auth.ts            Cadastro, login, sessões, tokens
    profile.ts         Questionário e recomendações
    matching.ts        Cálculo de compatibilidade (função pura)
    journey.ts         14 etapas, desbloqueio, missões, conclusão automática
    gamification.ts    Pontos, selos, dias ativos, histórico
    materials.ts       Geração de textos de venda (modelos prontos)
    crm.ts, finance.ts Clientes e financeiro
    content.ts         Conteúdo contínuo personalizado
    legal.ts           Fluxo de revisão jurídica/contábil (5 estados)
    privacy.ts         LGPD: consentimentos, exportação, exclusão
    billing/           Gateway (interface + demonstração), assinaturas, webhooks, ciclo mensal
    admin.ts, audit.ts Indicadores, listas e trilha de auditoria
  db/                  Esquema, conexão, dados iniciais e documentos legais (rascunho)
  components/          UI (site, área do usuário, admin, cobrança)
  lib/                 Formatação, validações, questionário, mentores, configuração
drizzle/               Migrações SQL geradas
scripts/               migrate, seed, reset, billing (ciclo diário)
tests/unit             Vitest
tests/e2e              Playwright
```

Princípios do documento aplicados no código: celular primeiro; sem promessa de ganhos; R$ 69,90 sempre visível junto do R$ 29,90; **acesso só com pagamento confirmado no servidor** (via webhook validado); nenhuma mensagem automática para clientes; coleta mínima de dados; mentores sempre identificados como IA.

---

## Instalação

Requisitos: **Node.js 20+** (testado com 22) e npm.

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run db:seed -- --demo
```

O `db:seed` aplica as migrações e insere os dados base (oportunidades, 14 etapas, 29 missões, selos, conteúdos, guias em rascunho, planos). Com `--demo`, cria também contas de demonstração (veja abaixo). Sem `DATABASE_URL`, tudo fica em `./.data/pglite`.

## Configuração e variáveis de ambiente

Todas estão documentadas em `.env.example`.

| Variável | Para quê | Obrigatória em produção |
| --- | --- | --- |
| `APP_URL` | Base dos links enviados por e-mail | Sim |
| `DATABASE_URL` | Postgres/Supabase. Vazio = PGlite local | Sim |
| `PGLITE_DIR` | Pasta do PGlite (dev). `memory` = em memória | Não |
| `DATABASE_POOL_MAX` | Conexões no pool (padrão 5) | Não |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrador criado pelo seed | Sim |
| `PAYMENT_WEBHOOK_SECRET` | Segredo HMAC dos webhooks | Sim (o padrão de desenvolvimento é inseguro) |
| `CRON_SECRET` | Protege `/api/cron/billing` | Sim |
| `DEV_MAILBOX` | Liga `/dev/emails` fora do desenvolvimento (só em homologação) | Não (deixe `false`) |
| `SUPPORT_EMAIL`, `SUPPORT_WHATSAPP`, `COMPANY_NAME`, `COMPANY_CNPJ`, `DPO_EMAIL` | Rodapé, termos e privacidade | Sim (antes do lançamento) |

Preços, promoção do 1º mês, prazo de aviso antes da 2ª cobrança, prazo de pausa após falha, validade do Pix e cupons **não** são variáveis de ambiente: são configurados no painel em **Admin › Plano e preço**.

## Banco de dados

- Esquema: `src/db/schema.ts` (contas, sessões, tokens, consentimentos, pedidos LGPD, documentos legais, perfil de talentos, oportunidades, recomendações, jornada, etapas, missões, variantes por oportunidade, progresso, histórico, selos, materiais, clientes, histórico de atendimento, lançamentos, guias jurídicos e comentários de revisão, conteúdos, progresso de conteúdo, planos, regras de cobrança, cupons, assinaturas, pagamentos, eventos de webhook, e-mails, auditoria, funil anônimo).
- Migrações SQL: `drizzle/`. Após alterar o esquema:

```bash
npm run db:generate
```

```bash
npm run db:migrate
```

- Reiniciar o banco local (apaga `./.data/pglite`):

```bash
npm run db:reset
```

- **Supabase**: crie o projeto, copie a connection string do pooler (Settings › Database), coloque em `DATABASE_URL` e rode `npm run db:seed`. O Supabase é usado como Postgres gerenciado; a autenticação é a do próprio app (o Supabase Auth não é usado). Se preferir RLS/Supabase Auth no futuro, a camada `src/server/auth.ts` é o ponto de troca.

## Execução

```bash
npm run dev
```

Abra http://localhost:3000. Em desenvolvimento, os e-mails (confirmação, recuperação de senha, boas-vindas, aviso de cobrança…) aparecem em http://localhost:3000/dev/emails.

Produção local:

```bash
npm run build
```

```bash
npm start
```

Ciclo diário de cobrança (avisos, renovações, novas tentativas, pausas, Pix vencido, conteúdos jurídicos vencidos):

```bash
npm run billing:run
```

> O PGlite não aceita dois processos abrindo a mesma pasta. Pare o `npm run dev` antes de rodar `db:seed`/`billing:run` no mesmo banco local (ou use o botão “Rodar ciclo de cobrança agora” em Admin › Plano e preço).

## Contas de demonstração

Criadas por `npm run db:seed -- --demo` (somente desenvolvimento):

| Papel | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@virarenda.local` | `admin12345` |
| Editor | `editor@virarenda.local` | `editor12345` |
| Revisor (jurídico/contábil) | `revisor@virarenda.local` | `revisor12345` |
| Assinante | `camila@virarenda.local` | `camila12345` |

Cartões de teste do checkout de demonstração (validade futura, qualquer CVV, CPF válido como `529.982.247-25`):

| Cartão | Resultado |
| --- | --- |
| `4242 4242 4242 4242` | Aprovado |
| `4000 0000 0000 0002` | Recusado |
| `4000 0000 0000 0341` | Aprovado no 1º mês; as mensalidades falham (para testar falha/pausa) |

Pix: a tela gera um código e confere sozinha a cada 4 s; no modo demonstração há os botões “Simular pagamento do Pix” e “Simular vencimento”.

## Testes

```bash
npm test
```

Testes de serviço (Vitest, banco PGlite em memória): cadastro, login e bloqueio por tentativas, recuperação de senha (uso único, derruba sessões), confirmação de e-mail, salvamento do perfil, questionário (11 + 1 adaptativa), recomendações e compatibilidade, escolha de oportunidade, missões (rascunho, obrigatórios, checklist, dependências, pontos uma única vez, missões automáticas), comemorações/marcos/selos, progresso, materiais, CRM (inclusive isolamento entre contas), painel financeiro (vendido x recebido x lucro), conteúdo contínuo, fluxo de revisão jurídica, LGPD (consentimentos, exportação, exclusão), checkout, webhook (assinatura inválida, idempotência, fora de ordem), ciclo mensal (aviso, renovação, falha, pausa, reativação, cancelamento, estorno, promoção só na 1ª assinatura, preço novo só para novas assinaturas).

```bash
npm run build
```

```bash
npm run test:e2e
```

Testes ponta a ponta (Playwright), rodados em **Desktop Chrome** e **Pixel 7** contra o build de produção e um banco isolado recriado a cada execução (`.data/e2e`): página inicial e filtros, páginas legais, proteção de rotas, questionário → cadastro → prévia travada → bloqueio de áreas pagas → confirmação de e-mail → cartão recusado → cartão aprovado → escolha do caminho, missão com autosave e comemoração, materiais + CRM + financeiro, recuperação de senha, Pix + cancelamento, privacidade/exportação/exclusão de conta, admin (visão geral, compras, assinante, ciclo de cobrança), bloqueio do admin para usuário comum e fluxo editor → revisor → publicação → guia visível ao usuário.

Navegador: o Playwright usa `PW_CHROMIUM` se definido; senão o Chromium pré-instalado em `/opt/pw-browsers/chromium` (quando existir); senão o próprio (rode `npx playwright install chromium` uma vez).

Outros:

```bash
npm run typecheck
```

```bash
npm run lint
```

## Pagamentos

- **Interface do gateway**: `src/server/billing/gateway.ts`. As telas e a regra de assinatura só conhecem esse contrato (gateway trocável sem mexer nas telas).
- **Gateway de demonstração**: `src/server/billing/demo-gateway.ts`. Não cobra nada; emite webhooks assinados com HMAC, pelo mesmo caminho de código de um webhook real.
- **Webhook**: `POST /api/webhooks/payments` com cabeçalho `x-signature` = HMAC-SHA256 do corpo. É o **único** lugar que muda status de pagamento e assinatura. Cada evento é gravado em `webhook_events` com o id do gateway como chave primária: o mesmo evento é processado uma vez só, mesmo se chegar repetido; eventos fora de ordem são ignorados.
- **Ciclo mensal** (`runBillingCycle`): aviso por e-mail N dias antes da 2ª cobrança (com link de cancelar), cobrança da mensalidade, nova tentativa diária em caso de falha, faixa “Mensalidade falhou” na área do usuário + e-mail, pausa após X dias **sem apagar dados**, encerramento no fim do período quando há cancelamento, vencimento de Pix. Agende `GET /api/cron/billing` 1x por dia com `Authorization: Bearer $CRON_SECRET`.
- **Modo produção** fica travado no admin até existir um adaptador real.

Para integrar um gateway brasileiro (Asaas, Mercado Pago, Pagar.me, Iugu…):

1. Criar `src/server/billing/<gateway>-gateway.ts` implementando `PaymentGateway` (criar cobrança/assinatura, estorno, validação da assinatura do webhook, tradução dos eventos para `payment.approved | refused | expired | refunded`).
2. Trocar o checkout de cartão para **tokenização no navegador** com o SDK do gateway. Hoje, no modo demonstração, o número do cartão passa pelo servidor só para validação e geração de um token fictício (apenas os 4 últimos dígitos são guardados). Em produção o servidor **não deve** receber dados de cartão (PCI-DSS).
3. Retornar o novo gateway em `getGateway()` e usá-lo em `handleWebhook()`.
4. Confirmar se o gateway oferece **Pix recorrente**; sem isso, o Pix mensal funciona como “novo código a cada mês” (já implementado: e-mail com o código).
5. Configurar a URL do webhook no painel do gateway e o segredo em `PAYMENT_WEBHOOK_SECRET`.

## Publicação

Sugestão: **Vercel** (app) + **Supabase** (Postgres).

1. Criar o banco no Supabase e pegar a connection string do pooler.
2. Na Vercel, importar o repositório e configurar as variáveis de produção (`APP_URL`, `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PAYMENT_WEBHOOK_SECRET`, `CRON_SECRET`, dados da empresa). **Não** defina `DEV_MAILBOX`.
3. Rodar uma vez, apontando para o banco de produção: `npm run db:seed` (aplica migrações, dados base e cria o admin; sem `--demo`).
4. Agendar o cron diário (`vercel.json` › `crons` ou serviço externo) chamando `/api/cron/billing` com o `Authorization`.
5. Implementar o envio real de e-mails em `src/server/email.ts › deliver()` (Resend, SES, SMTP…). Hoje os e-mails ficam na tabela `emails`.
6. Revisões jurídica e contábil (abaixo) antes de abrir para o público.

Qualquer host Node 20+ funciona (`npm run build && npm start`). Para PGlite em produção não há suporte: use Postgres.

## Mapa de telas

**Site público:** início (10 blocos: menu fixo, primeira dobra com conversa animada, como funciona, exemplos com filtros, demo “sua primeira semana”, mentores, benefícios e o que não fazemos, plano e preço, dúvidas, chamada final + rodapé; no celular, menu em tela cheia e botão “Começar grátis” fixo ao rolar), plano, questionário grátis, cadastro, entrar, recuperar/redefinir senha, confirmar e-mail, termos, privacidade, cookies (banner com “Aceitar” / “Só essenciais”).

**Checkout:** resumo com “Hoje R$ 29,90 · a partir de [data] R$ 69,90/mês”, cartão ou Pix, aceite obrigatório para habilitar o botão, cupom, 2 passos no celular, telas de aprovado (com comemoração e 1ª conquista), recusado, Pix aguardando (conferência automática), Pix expirado.

**Área do usuário:** jornada (etapa atual, 14 pontos de progresso, pontos, conquistas, dias ativos, próxima etapa bloqueada, retornos do dia), perfil de talentos, oportunidades (3 com porquê e limites; antes de assinar, só a 1ª aberta) e detalhe, missões (14 etapas com cadeados e motivo, missões com objetivo, “entenda o porquê”, exemplo, ferramentas, campos, checklist, autosave, pausar, concluir com confete e palmas opcionais), conquistas e histórico, materiais de venda (9 tipos, 3 tons, outra versão, copiar, baixar, salvar, prévia e botão do WhatsApp), meus clientes (quadro de 6 colunas com arrastar, ficha, histórico, próxima ação, lembrete, WhatsApp com texto pronto), financeiro (vendido, recebido, custos, lucro estimado, gráfico, a receber), organize seu negócio (guias publicados com fonte e revisor, missão “converse com um contador”, roteiro da consulta para baixar), conteúdos e desafios, perfil (dados, meu plano, pagamentos, preferências, privacidade, atividades). Menu lateral no computador, barra inferior no celular.

**Admin:** visão geral (assinantes, 1º mês, % que pagou o 2º mês, receita, funil, “precisa de atenção”), compras (filtros, busca, CSV, eventos do gateway), assinantes e usuários (papéis, bloqueio) e detalhe do assinante (pagamentos, só números de uso, reenviar acesso, cancelar renovação, reembolsar, exportar dados, excluir conta), plano e preço (preços, promoção, regras, cupons, prévia, modo do gateway, rodar ciclo), oportunidades (ficha + regras de compatibilidade, rascunho/publicar), missões (etapas e dependências, editor de missão com campos, checklist, dependência, variante por oportunidade e prévia), conteúdos, revisão jurídica (5 estados, comentários, só Revisor aprova), selos e pontos, indicadores de uso, LGPD e auditoria.

---

## Entrega

### 1. Funcionalidades desenvolvidas (funcionando e testadas)

- Site público completo com os 10 blocos, responsivo, e páginas legais versionadas.
- Questionário com 11 perguntas + 1 adaptativa, uma por tela, salvo a cada resposta (no navegador até criar a conta; depois, na conta) e editável no perfil, com recálculo e aviso se a oportunidade escolhida deixou de combinar.
- Cadastro com coleta mínima, aceite de Termos/Privacidade registrado com versão e data, consentimento opcional de e-mails, confirmação de e-mail, login com limite de tentativas, recuperação de senha com link de 1 hora e uso único, troca de senha.
- Compatibilidade (habilidades + tempo + equipamentos + orçamento + online/presencial, com ajustes por interesses e conforto com vendas), com motivos e limites explicados; oportunidade com recurso faltando aparece com aviso, nunca escondida.
- Prévia gratuita (1ª oportunidade aberta, 2 travadas) e bloqueio das áreas pagas até o pagamento ser confirmado no servidor.
- Jornada de 14 etapas com regras de desbloqueio configuráveis (etapas anteriores + condições como 1ª venda e 30 dias de registros), 29 missões, missões automáticas, dependências, variantes por oportunidade, autosave, pausar/retomar, editar sem perder pontos.
- Gamificação: pontos, marcos por etapa, 10 selos configuráveis, dias ativos (não exige sequência), histórico, comemoração com confete e som opcional.
- Materiais de venda em 3 tons a partir das respostas da jornada; CRM; painel financeiro com “a receber” integrado ao lembrete do cliente.
- Organize seu negócio com missões de encaminhamento e roteiro da consulta; quando não há guia aprovado, a tela orienta a procurar profissional habilitado.
- Conteúdo contínuo personalizado por etapa e oportunidade, desafios com progresso, sugestão de nova oportunidade, lidos descem para o fim.
- Assinatura mensal com 1º mês promocional, cupons, planos trimestral/semestral/anual preparados (inativos), webhooks assinados e idempotentes, ciclo mensal completo, cancelamento em 2 toques, troca de cartão com nova tentativa, estorno, e-mails transacionais.
- Painel administrativo completo com papéis (admin, editor, revisor) e trilha de auditoria.
- LGPD: exportação de dados em JSON, exclusão de conta (com pagamentos mantidos anonimizados), consentimentos com histórico, banner de cookies, e-mails mascarados nas listas do admin, admin sem acesso ao conteúdo das pessoas.
- Segurança: senhas com bcrypt, sessões com hash no banco, cookies `httpOnly`/`SameSite=Lax` (e `Secure` em produção), cabeçalhos de segurança, proteção de Server Actions contra CSRF (verificação de origem do Next.js), checagem de dono em todos os dados do usuário.

### 2. Funcionalidades ainda demonstrativas

- **Pagamentos**: gateway de demonstração (nenhuma cobrança real; cartões de teste; Pix com QR ilustrativo e simulação).
- **E-mails**: gravados na tabela `emails` e visíveis em `/dev/emails`; nenhum e-mail é enviado de fato.
- **Mentores (IA)**: os textos dos mentores e os materiais de venda vêm de **modelos prontos** preenchidos com as respostas da pessoa; não há modelo de IA conectado ainda (previsto na Fase 3 do documento). A interface informa isso na tela de materiais.
- **Conteúdo das oportunidades**: preços sugeridos, tempos e investimentos estão como `[R$ __]`/`[__]` (valores do negócio a definir); `investmentMin` e horas mínimas são estimativas iniciais usadas no cálculo.
- **Planos trimestral, semestral e anual**: criados e editáveis, mas inativos e com valores de exemplo.
- **Conteúdo contínuo**: 16 itens iniciais, escritos para o MVP; precisa de curadoria editorial.
- **QR Code do Pix**: ilustrativo.

### 3. Integrações pendentes

- Gateway de pagamento brasileiro real (adaptador + tokenização de cartão no navegador + configuração do webhook + confirmação de Pix recorrente).
- Provedor de e-mail transacional (implementar `deliver()`), com domínio autenticado (SPF/DKIM).
- Agendador para o ciclo diário (`/api/cron/billing`).
- Modelo de IA para mentores e materiais (Fase 3), se desejado.
- Ferramenta de medição (só depois do consentimento de cookies; nenhuma está ativa).
- Monitoramento de erros e backups do banco.

### 4. Pendências jurídicas e contábeis

Implementar essas funcionalidades **não significa conformidade jurídica completa**. Antes do lançamento:

- Revisão por advogado de **Termos de Uso, Política de Privacidade e Política de Cookies** (hoje marcados “Rascunho · aguardando advogado”), incluindo bases legais da LGPD, prazos de retenção, operadores (gateway, hospedagem, e-mail), transferência internacional e nomeação do encarregado (DPO).
- Definir **política de reembolso e direito de arrependimento** (CDC, art. 49) — o estorno hoje encerra o acesso imediatamente, regra provisória.
- Definir **prazos de aviso, novas tentativas e pausa** (`[3]` e `[X]` dias no documento) e a regra para mudar o preço de quem já assina.
- Contratar **contador e advogado revisores** (CRC/OAB) e passar os 7 guias pelo fluxo de revisão: hoje 2 estão “Em revisão” e 5 em “Rascunho”; **nenhum está publicado** (por isso a área “Organize seu negócio” orienta a procurar profissional).
- Validar com contador o **prazo de guarda dos registros de pagamento** após exclusão de conta.
- Razão social, CNPJ, domínio e **registro da marca** “Vira Renda”.
- Revisar textos que mencionam MEI, nota fiscal e alimentos (regras variam por atividade e município).

### 5. Como executar

```bash
npm install
```

```bash
npm run db:seed -- --demo
```

```bash
npm run dev
```

Acesse http://localhost:3000 (e-mails em `/dev/emails`; contas de demonstração na tabela acima).

### 6. Próximas etapas para lançamento

1. Decisões pendentes do documento: gateway (com Pix recorrente?), prazos de aviso/falha/pausa, política de reembolso.
2. Integrar gateway real e e-mail transacional; testar cobranças reais em ambiente de homologação do gateway.
3. Revisão jurídica dos documentos e revisão profissional dos guias; publicar os guias pelo fluxo do admin.
4. Preencher a biblioteca de oportunidades com valores reais (pesquisa local) e revisar textos das missões e conteúdos.
5. Publicar em Vercel + Supabase com variáveis de produção, cron diário, backups e monitoramento.
6. Teste com um grupo pequeno de usuários reais (celular primeiro) e ajuste de textos/fluxos.
7. Depois: mentores com IA de verdade, conteúdo por etapa ampliado, plano anual com desconto quando houver dados de retenção de 3 e 6 meses.
