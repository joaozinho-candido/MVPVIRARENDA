import { closeDb, runMigrations } from "../src/db";
import { seedBase, ensureUser } from "../src/db/seed";
import { startCheckout } from "../src/server/billing/subscriptions";
import { saveTalentProfile, chooseOpportunity, getRecommendations } from "../src/server/profile";

const demo = process.argv.includes("--demo");

(async () => {
  await runMigrations();
  await seedBase();
  console.log("✓ Dados base (oportunidades, etapas, missões, selos, conteúdos, guias, planos)");

  const isProd = process.env.NODE_ENV === "production";
  const adminEmail = process.env.ADMIN_EMAIL ?? (isProd ? "" : "admin@virarenda.local");
  const adminPassword = process.env.ADMIN_PASSWORD ?? (isProd ? "" : "admin12345");
  if (adminEmail && adminPassword) {
    await ensureUser("Administração", adminEmail.toLowerCase(), adminPassword, "admin");
    console.log(`✓ Admin: ${adminEmail}${process.env.ADMIN_PASSWORD ? "" : " / senha padrão de desenvolvimento"}`);
  } else {
    console.log("! Defina ADMIN_EMAIL e ADMIN_PASSWORD para criar o administrador.");
  }

  if (demo) {
    await ensureUser("Edna Editora", "editor@virarenda.local", "editor12345", "editor");
    await ensureUser("Rui Revisor", "revisor@virarenda.local", "revisor12345", "reviewer");
    const camila = await ensureUser("Camila Rocha", "camila@virarenda.local", "camila12345", "user");
    await saveTalentProfile(camila.id, {
      skills: ["fotos", "redes", "atendimento"],
      interests: ["beleza", "comercio"],
      helpWith: ["fotos", "redes"],
      experiences: ["vendas", "atendimento"],
      period: ["noite"],
      hoursPerDay: 1,
      equipment: ["celular", "internet"],
      budget: 100,
      mode: "online",
      salesComfort: "medio",
      goal: 800,
    });
    try {
      await startCheckout(camila.id, {
        method: "card",
        accepted: true,
        card: { number: "4242 4242 4242 4242", expiry: "12/30", cvv: "123", cpf: "529.982.247-25" },
      });
      const recs = await getRecommendations(camila.id);
      await chooseOpportunity(camila.id, recs[0].opp.id);
    } catch (e) {
      console.log("(demo) assinatura já existente:", (e as Error).message);
    }
    console.log("✓ Contas de demonstração: camila@ / editor@ / revisor@virarenda.local (senhas no README)");
  }
  await closeDb();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
