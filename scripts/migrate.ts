import { runMigrations, closeDb, dbDriver } from "../src/db";

(async () => {
  await runMigrations();
  console.log(`✓ Migrações aplicadas (${dbDriver()})`);
  await closeDb();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
