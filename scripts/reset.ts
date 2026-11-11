import fs from "node:fs";
import path from "node:path";

if (process.env.DATABASE_URL) {
  console.error("db:reset só apaga o banco local (PGlite). Para Postgres, use as ferramentas do provedor.");
  process.exit(1);
}
const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
fs.rmSync(dir, { recursive: true, force: true });
console.log("✓ Banco local apagado:", dir);
