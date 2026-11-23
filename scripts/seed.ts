import { closeDb, runMigrations } from "../src/db";
import { seedBase, seedAdmin, seedDemo } from "../src/db/seed";

const demo = process.argv.includes("--demo");

(async () => {
  if (process.env.VERCEL && !process.env.DATABASE_URL) {
    console.warn("! DATABASE_URL não configurada na Vercel: pulando banco. Conecte o Neon em Storage e publique de novo.");
    return;
  }
  await runMigrations();
  await seedBase();
  console.log("✓ Dados base (oportunidades, etapas, missões, selos, conteúdos, guias, planos)");
  const admin = await seedAdmin();
  console.log(admin ? `✓ Admin: ${admin.email}` : "! Defina ADMIN_EMAIL e ADMIN_PASSWORD para criar o administrador.");
  if (demo) {
    await seedDemo();
    console.log("✓ Contas de demonstração: camila@ / editor@ / revisor@virarenda.local (senhas no README)");
  }
  await closeDb();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
