import { beforeAll } from "vitest";
import { runMigrations } from "@/db";
import { seedBase } from "@/db/seed";

beforeAll(async () => {
  await runMigrations();
  await seedBase();
});
