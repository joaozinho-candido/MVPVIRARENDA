export async function prepareLocalDatabase() {
  if (process.env.NODE_ENV === "production" || process.env.DATABASE_URL) return;
  try {
    const { runMigrations } = await import("./db");
    const { seedBase, seedAdmin, seedDemo } = await import("./db/seed");
    await runMigrations();
    await seedBase();
    await seedAdmin();
    await seedDemo();
    console.log("[vira-renda] Banco local pronto: admin@virarenda.local / admin12345 · camila@virarenda.local / camila12345");
  } catch (e) {
    console.error("[vira-renda] Não foi possível preparar o banco local:", e);
  }
}
