import { test, expect } from "@playwright/test";
import { answerQuiz, register, uniqueEmail, linkFromMailbox, payWithCard, subscribedAccount, login, PASSWORD, dismissCookies } from "./helpers";

test("questionário → cadastro → prévia (1 aberta, 2 travadas) → pagamento só com e-mail confirmado", async ({ page }) => {
  const email = uniqueEmail("fluxo");
  await answerQuiz(page);
  await register(page, email);
  await expect(page).toHaveURL(/\/app\/oportunidades/);
  await expect(page.getByText("Seu resultado está pronto!")).toBeVisible();
  await expect(page.getByText("Libera com a assinatura", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Edição de vídeos curtos" })).toBeVisible();

  // Controle de acesso: áreas pagas bloqueadas antes do pagamento confirmado
  await page.goto("/app/missoes");
  await expect(page).toHaveURL(/\/app\?bloqueado=1/);
  await expect(page.getByText("Essa área faz parte do plano")).toBeVisible();

  // Sem e-mail confirmado não dá para assinar
  await page.goto("/assinar");
  await expect(page.getByText("Confirme seu e-mail antes de assinar.")).toBeVisible();
  await page.goto(await linkFromMailbox(page, email, "/confirmar-email"));
  await expect(page.getByRole("heading", { name: "E-mail confirmado!" })).toBeVisible();

  // Cartão recusado
  await payWithCard(page, "4000000000000002");
  await expect(page.getByRole("heading", { name: "Não deu certo com este cartão" })).toBeVisible();
  await page.goto("/app/materiais");
  await expect(page).toHaveURL(/bloqueado=1/);

  // Cartão aprovado (via webhook assinado no modo demonstração)
  await payWithCard(page, "4242424242424242");
  await expect(page.getByRole("heading", { name: "Pagamento confirmado!" })).toBeVisible();
  await expect(page.getByText("Primeira conquista: Comecei!")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("link", { name: "Ver minhas oportunidades" }).click();
  await expect(page.getByText("Libera com a assinatura", { exact: true })).toHaveCount(0);

  // Escolher caminho
  await page.getByRole("button", { name: "Escolher este caminho" }).first().click();
  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByRole("heading", { name: /Oi, Camila! Etapa 1 de 14/ })).toBeVisible();
});

test("missão: salva sozinha, exige checklist, comemora com pontos e progresso", async ({ page }) => {
  await subscribedAccount(page, "missao");
  await page.goto("/app");
  await page.getByRole("link", { name: /Começar missão|Continuar missão/ }).click();
  await expect(page.getByRole("heading", { name: "Confirmar meu retrato" })).toBeVisible();
  await page.getByLabel(/Qual habilidade você mais gosta/).fill("Fotos, porque adoro editar.");
  await expect(page.getByText("✓ Salvo agora")).toBeVisible();
  const concluir = page.getByRole("button", { name: /Concluir \(falta 1 item\)/ });
  await expect(concluir).toBeDisabled();
  await page.getByRole("checkbox", { name: "Revisei meu perfil de talentos" }).check();
  await page.getByRole("button", { name: "Concluir missão" }).click();
  const dlg = page.getByRole("dialog", { name: "Missão concluída!" });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByText(/^\+\d+ pontos$/)).toBeVisible();
  await expect(dlg.getByText("Etapa 1: 2 de 2 missões feitas")).toBeVisible();
  await dlg.getByRole("button", { name: "Continuar" }).click();
  await page.goto("/app/conquistas");
  await expect(page.getByText("Marco: etapa 1 completa")).toBeVisible();
  await expect(page.getByText("Confirmar meu retrato")).toBeVisible();
});

test("materiais, CRM e financeiro", async ({ page }) => {
  await subscribedAccount(page, "trabalho");
  // Materiais
  await page.goto("/app/materiais");
  await expect(page.getByText("Prévia no WhatsApp")).toBeVisible();
  await page.getByRole("button", { name: "Formal" }).click();
  await expect(page.locator("#mat-text")).toHaveValue(/Bom dia/);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("✓ Salvo em Meus materiais")).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir no WhatsApp" })).toHaveAttribute("href", /wa\.me/);

  // CRM
  await page.goto("/app/clientes/novo");
  await page.getByLabel("Cliente (pessoa ou negócio)").fill("Salão Aurora");
  await page.getByLabel("Pessoa de contato").fill("Rafaela");
  await page.getByLabel("Telefone / WhatsApp").fill("11988887777");
  await page.getByLabel("Próxima ação").fill("Perguntar o que achou dos vídeos");
  await page.getByRole("button", { name: "Salvar cliente" }).click();
  await expect(page.getByRole("heading", { name: "Salão Aurora" })).toBeVisible();
  await page.getByLabel("Anotar o que aconteceu").fill("Enviei 2 vídeos");
  await page.getByRole("button", { name: "Anotar" }).click();
  await expect(page.getByText("Enviei 2 vídeos").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir WhatsApp com mensagem pronta" })).toHaveAttribute("href", /wa\.me\/5511988887777/);
  await page.getByRole("combobox", { name: "Status" }).selectOption("interessado");
  await page.waitForTimeout(800);
  await page.goto("/app/clientes");
  await expect(page.getByRole("region", { name: "Interessado" }).getByRole("link", { name: "Salão Aurora" })).toBeVisible();

  // Financeiro
  await page.goto("/app/financeiro");
  await page.getByRole("button", { name: "+ Registrar" }).click();
  await page.getByLabel("Descrição").fill("Pacote 4 vídeos");
  await page.getByLabel("Valor (R$)").fill("400");
  await page.getByRole("button", { name: "Ainda não" }).click();
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("a receber")).toBeVisible();
  await expect(page.getByText("Faturamento · vendido").locator("..").getByText("R$ 400")).toBeVisible();
  await expect(page.getByText("Receita · já recebido").locator("..").getByText("R$ 0")).toBeVisible();
  await page.getByRole("button", { name: "Marcar recebido" }).click();
  await expect(page.getByText("Receita · já recebido").locator("..").getByText("R$ 400")).toBeVisible();
});

test("recuperação de senha com link de uso único", async ({ page }) => {
  await login(page, "camila@virarenda.local", "camila12345").catch(() => {});
  await page.context().clearCookies();
  const email = uniqueEmail("senha");
  await answerQuiz(page);
  await register(page, email);
  await page.context().clearCookies();
  await page.goto("/recuperar-senha");
  await dismissCookies(page);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByText(/Se houver uma conta com este e-mail/)).toBeVisible();
  const link = await linkFromMailbox(page, email, "/redefinir-senha");
  await page.goto(link);
  await page.locator("#f-password").fill("nova-senha-456");
  await page.locator("#f-confirm").fill("nova-senha-456");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.getByText("Senha alterada. Entre com a nova senha.")).toBeVisible();
  await login(page, email, "nova-senha-456");
  await expect(page).toHaveURL(/\/app/);
  // link não funciona duas vezes
  await page.context().clearCookies();
  await page.goto(link);
  await page.locator("#f-password").fill("outra-senha-789");
  await page.locator("#f-confirm").fill("outra-senha-789");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.getByText(/venceu ou já foi usado/)).toBeVisible();
  void PASSWORD;
});

test("Pix: aguarda, confirma sozinho e libera acesso; cancelar assinatura no perfil", async ({ page }) => {
  const email = uniqueEmail("pix");
  await answerQuiz(page);
  await register(page, email);
  await page.goto(await linkFromMailbox(page, email, "/confirmar-email"));
  await page.goto("/assinar");
  const cont = page.getByRole("button", { name: "Continuar" });
  if (await cont.isVisible()) await cont.click();
  await page.getByRole("tab", { name: "Pix" }).click();
  await page.getByRole("checkbox", { name: /Entendi: hoje pago/ }).check();
  await page.getByRole("button", { name: /Gerar Pix/ }).click();
  await expect(page.getByRole("button", { name: "Copiar código Pix" })).toBeVisible();
  await page.getByRole("button", { name: "Simular pagamento do Pix" }).click();
  await expect(page.getByRole("heading", { name: "Pagamento confirmado!" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.goto("/app/perfil?aba=plano");
  await expect(page.getByText(/Próxima cobrança:.*R\$\s?69,90/)).toBeVisible();
  await page.getByRole("button", { name: "Cancelar assinatura" }).click();
  await page.getByRole("button", { name: "Sim, cancelar" }).click();
  await expect(page.getByText("Cancelada · acesso até o fim do período")).toBeVisible();
  await page.goto("/app/missoes"); // ainda tem acesso até o fim do período pago
  await expect(page.getByRole("heading", { name: "Jornada e missões" })).toBeVisible();
});

test("perfil: privacidade, exportação de dados e preferências", async ({ page }) => {
  await subscribedAccount(page, "lgpd");
  await page.goto("/app/perfil?aba=privacidade");
  await expect(page.getByText(/Termos v1\.0 · aceito/)).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Baixar todos os meus dados" }).click()]);
  expect(download.suggestedFilename()).toBe("meus-dados-vira-renda.json");
  await page.goto("/app/perfil?aba=preferencias");
  const sw = page.getByRole("switch").first();
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await sw.click();
  await expect(sw).toHaveAttribute("aria-checked", "false");
  await page.goto("/app/perfil?aba=privacidade");
  await page.getByRole("button", { name: "Excluir minha conta" }).click();
  await page.getByLabel("Sua senha").fill(PASSWORD);
  await page.getByLabel("Digite EXCLUIR para confirmar").fill("EXCLUIR");
  await page.getByRole("button", { name: "Excluir definitivamente" }).click();
  await expect(page.getByText("Sua conta e seus dados foram excluídos")).toBeVisible();
});
