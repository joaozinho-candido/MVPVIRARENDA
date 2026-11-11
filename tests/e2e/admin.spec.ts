import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("usuário comum não entra no admin", async ({ page }) => {
  await login(page, "camila@virarenda.local", "camila12345");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/app$/);
});

test("admin: visão geral, compras, assinante, plano e preço", async ({ page }) => {
  await login(page, "admin@virarenda.local", "admin12345");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "O negócio inteiro em uma tela" })).toBeVisible();
  await expect(page.getByText("Assinantes ativos")).toBeVisible();
  await page.goto("/admin/compras");
  await expect(page.getByRole("cell", { name: /Camila Rocha/ }).first()).toBeVisible();
  await page.getByRole("link", { name: "Camila Rocha" }).first().click();
  await expect(page.getByText("Só números. O admin não lê os clientes nem os textos da pessoa.")).toBeVisible();
  await page.goto("/admin/planos");
  await expect(page.getByText("Modo Demonstração")).toBeVisible();
  await page.getByRole("button", { name: "Rodar ciclo de cobrança agora" }).click();
  await expect(page.getByText(/"notices"/)).toBeVisible();
});

test("revisão jurídica: editor envia, só revisor aprova, editor publica e usuário vê", async ({ page, context }) => {
  const title = `Guia e2e ${Date.now()}`;
  await login(page, "editor@virarenda.local", "editor12345");
  await page.goto("/admin/revisao/novo");
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Resumo").fill("Resumo de teste");
  await page.getByLabel("Texto").fill("Texto informativo de teste.");
  await page.getByLabel("Fonte oficial (link)").fill("https://www.gov.br/empresas-e-negocios");
  await page.getByLabel("Consultada em").fill("2026-11-01");
  await page.getByLabel("Revisor (nome)").fill("Fulana de Tal");
  await page.getByLabel("Registro (CRC/OAB)").fill("CRC 000000");
  await page.getByLabel("Revisar de novo em").fill("2027-05-01");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page).toHaveURL(/\/admin\/revisao\/[0-9a-f-]+\?salvo=1/);
  const url = page.url().split("?")[0];
  await page.getByRole("button", { name: "Enviar para revisão" }).click();
  await expect(page.getByText("✓ Feito")).toBeVisible();
  await expect(page.getByRole("button", { name: "Aprovar" })).toHaveCount(0); // editor não aprova

  await context.clearCookies();
  await login(page, "revisor@virarenda.local", "revisor12345");
  await page.goto(url);
  await page.getByRole("button", { name: "Aprovar" }).click();
  await expect(page.getByText("✓ Feito")).toBeVisible();

  await context.clearCookies();
  await login(page, "editor@virarenda.local", "editor12345");
  await page.goto(url);
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("✓ Feito")).toBeVisible();

  await context.clearCookies();
  await login(page, "camila@virarenda.local", "camila12345");
  await page.goto("/app/organize");
  await expect(page.getByRole("link", { name: title })).toBeVisible();
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByText("Revisado por: Fulana de Tal, CRC 000000")).toBeVisible();
  await expect(page.getByText("Conteúdo informativo. Não é parecer contábil ou jurídico.").first()).toBeVisible();
});
