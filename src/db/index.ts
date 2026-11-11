import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

/**
 * Banco de dados.
 * - Produção (Supabase ou qualquer Postgres): defina DATABASE_URL.
 * - Desenvolvimento/testes sem DATABASE_URL: PGlite (Postgres embutido) em ./.data/pglite
 *   ou em memória quando PGLITE_DIR=memory (usado pelos testes).
 * Ambos usam o mesmo esquema e as mesmas migrações SQL em ./drizzle.
 */
export type DB = PostgresJsDatabase<typeof schema>;

type Holder = { db?: DB; pglite?: PGlite; sql?: ReturnType<typeof postgres> };
const g = globalThis as unknown as { __viraDb?: Holder };
const holder: Holder = (g.__viraDb ??= {});

function create(): DB {
  const url = process.env.DATABASE_URL;
  if (url) {
    holder.sql = postgres(url, { max: Number(process.env.DATABASE_POOL_MAX ?? 5), prepare: false });
    return drizzlePostgres(holder.sql, { schema });
  }
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  if (dir !== "memory") fs.mkdirSync(dir, { recursive: true });
  holder.pglite = new PGlite(dir === "memory" ? undefined : dir);
  return drizzlePglite(holder.pglite, { schema }) as unknown as DB;
}

export const db: DB = new Proxy({} as DB, {
  get(_t, prop) {
    holder.db ??= create();
    const value = Reflect.get(holder.db as object, prop);
    return typeof value === "function" ? value.bind(holder.db) : value;
  },
});

export function dbDriver(): "postgres" | "pglite" {
  return process.env.DATABASE_URL ? "postgres" : "pglite";
}

export async function runMigrations() {
  holder.db ??= create();
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (holder.pglite) {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(holder.db as never, { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    await migrate(holder.db, { migrationsFolder });
  }
}

export async function closeDb() {
  await holder.pglite?.close();
  await holder.sql?.end();
  holder.db = undefined;
  holder.pglite = undefined;
  holder.sql = undefined;
}

export { schema };
