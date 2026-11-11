import { runBillingCycle } from "@/server/billing/subscriptions";
import { autoOutdate } from "@/server/legal";
import { purgeExpired } from "@/server/auth";
import { config } from "@/lib/config";
import { safeEqual } from "@/lib/crypto";

/** Rodar 1x por dia (Vercel Cron, GitHub Actions, cron do servidor...). Protegido por CRON_SECRET. */
async function run(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!config.cronSecret || !safeEqual(auth, `Bearer ${config.cronSecret}`)) return new Response("Não autorizado", { status: 401 });
  const report = await runBillingCycle();
  const outdated = await autoOutdate();
  await purgeExpired();
  return Response.json({ ...report, outdated });
}

export const GET = run;
export const POST = run;
