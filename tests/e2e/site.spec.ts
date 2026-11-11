import { test, expect } from "@playwright/test";
import { dismissCookies } from "./helpers";

test("página inicial com os 10 blocos, filtros e preço de depois visível", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /transformar o que já sabe fazer/ })).toBeVisible();
  await expect(page.getByText("Bia · mentora (IA)").first()).toBeVisible();
  await dismissCookies(page);
  for (const h of ["Do “não sei por onde começar” à primeira venda", "O que dá para fazer com o que você já tem", "Veja o produto funcionando, sem cadastro", "Uma equipe de 6 mentores", "Um plano só, sem letra miúda", "Perguntas frequentes"]) {
    await expect(page.getByRole("heading", { name: h })).toBeVisible();
  }
  // Filtro "Presencial" esconde oportunidades só online
  await page.getByRole("button", { name: "Presencial", exact: true }).click();
  await expect(page.getByRole("button", { name: /Edição de vídeos curtos/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Serviços locais/ })).toBeVisible();
  // Preço: R$ 29,90 e R$ 69,90 lado a lado
  const plano = page.locator("#plano");
  await expect(plano.getByText("R$ 29,90").first()).toBeVisible();
  await expect(plano.getByText("R$ 69,90").first()).toBeVisible();
  // Demo da primeira semana: trocar o dia troca a conversa
  await page.getByRole("tab", { name: /Qui · Calcular o preço/ }).click();
  await expect(page.getByText("Jornada › Custos e preço")).toBeVisible();
  if (isMobile) {
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
    await page.getByRole("button", { name: "Fechar menu" }).click();
  }
});

test("páginas legais têm versão e aviso de revisão pendente", async ({ page }) => {
  for (const [path, title] of [["/termos", "Termos de Uso"], ["/privacidade", "Política de Privacidade"], ["/cookies", "Política de Cookies"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
    await expect(page.getByText("Rascunho · aguardando advogado")).toBeVisible();
    await expect(page.getByText(/Versão 1\.0/)).toBeVisible();
  }
});

test("áreas protegidas exigem login", async ({ page }) => {
  await page.goto("/app/financeiro");
  await expect(page).toHaveURL(/\/entrar\?next=/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/entrar/);
});
