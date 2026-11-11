import { expect, type Page } from "@playwright/test";

let n = 0;
export const uniqueEmail = (tag: string) => `e2e.${tag}.${Date.now()}.${n++}@teste.com`;
export const PASSWORD = "senha-forte-123";

/** Abre a caixa de e-mails de desenvolvimento e retorna o link do último e-mail para o destinatário. */
export async function linkFromMailbox(page: Page, to: string, path: string) {
  await page.goto(`/dev/emails?para=${encodeURIComponent(to)}`);
  const card = page.getByTestId("email").filter({ hasText: to }).filter({ hasText: path }).first();
  await expect(card).toBeVisible();
  const href = await card.locator(`a[href*="${path}"]`).first().getAttribute("href");
  return href!;
}

export async function dismissCookies(page: Page) {
  const btn = page.getByRole("button", { name: "Só essenciais" });
  if (await btn.isVisible().catch(() => false)) await btn.click();
}

export async function answerQuiz(page: Page) {
  await page.goto("/questionario");
  await dismissCookies(page);
  const pick = async (labels: string[]) => {
    for (const l of labels) await page.getByRole("checkbox", { name: l }).or(page.getByRole("radio", { name: l })).first().click();
    await page.getByRole("button", { name: /Continuar|Ver meu resultado/ }).click();
  };
  await pick(["Fotos", "Redes sociais", "Atendimento"]); // habilidades
  await pick(["Beleza e moda"]); // interesses
  await pick(["Arrumar fotos e vídeos"]); // pedem ajuda
  await pick(["Vendas ou loja"]); // experiências
  await pick(["Noite"]); // horários
  await pick(["Cerca de 1 hora"]);
  await pick(["Celular com câmera", "Internet em casa"]);
  await pick(["Até R$ 100"]);
  await pick(["Online, de casa"]);
  await pick(["Consigo, com um texto pronto"]);
  await pick(["Uns R$ 800"]);
}

export async function register(page: Page, email: string, name = "Camila Teste") {
  await expect(page).toHaveURL(/\/cadastro/);
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.locator("#f-password").fill(PASSWORD);
  await page.getByRole("checkbox", { name: /Aceito os Termos/ }).check();
  await page.getByRole("button", { name: /Ver meu resultado|Criar conta/ }).click();
  await expect(page).toHaveURL(/\/app/);
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/entrar");
  await dismissCookies(page);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.locator("#f-password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).not.toHaveURL(/\/entrar/);
}

export async function payWithCard(page: Page, number: string) {
  await page.goto("/assinar");
  const cont = page.getByRole("button", { name: "Continuar" });
  if (await cont.isVisible()) await cont.click(); // celular: passo 1 de 2
  await page.getByLabel("Número do cartão").fill(number);
  await page.getByLabel("Validade").fill("1230");
  await page.getByLabel("CVV").fill("123");
  await page.getByLabel("CPF do titular").fill("52998224725");
  const pay = page.getByRole("button", { name: /Pagar R\$/ });
  await expect(pay).toBeDisabled(); // só habilita com o aceite
  await page.getByRole("checkbox", { name: /Entendi: hoje pago/ }).check();
  await pay.click();
}

/** Cria uma conta já com questionário, e-mail confirmado e assinatura paga. */
export async function subscribedAccount(page: Page, tag: string) {
  const email = uniqueEmail(tag);
  await answerQuiz(page);
  await register(page, email);
  await expect(page).toHaveURL(/\/app\/oportunidades/);
  await page.goto(await linkFromMailbox(page, email, "/confirmar-email"));
  await expect(page.getByRole("heading", { name: "E-mail confirmado!" })).toBeVisible();
  await payWithCard(page, "4242424242424242");
  await expect(page.getByText("Primeira conquista: Comecei!")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click(); // fecha a comemoração
  return email;
}
