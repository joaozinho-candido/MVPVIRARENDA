import { closeDb } from "../src/db";
import { runBillingCycle } from "../src/server/billing/subscriptions";
import { autoOutdate } from "../src/server/legal";
import { purgeExpired } from "../src/server/auth";

(async () => {
  const report = await runBillingCycle();
  const outdated = await autoOutdate();
  await purgeExpired();
  console.log("Ciclo de cobrança:", report, "· conteúdos desatualizados:", outdated);
  await closeDb();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
