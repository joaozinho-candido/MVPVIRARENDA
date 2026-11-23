import { config } from "@/lib/config";

/** Só em desenvolvimento: devolve os cabeçalhos que chegaram num POST (para entender proxies). */
export async function POST(req: Request) {
  if (!config.devMailbox) return new Response("Não disponível", { status: 404 });
  const h = req.headers;
  return Response.json({
    origin: h.get("x-diag-origin"),
    "x-forwarded-host (original)": h.get("x-diag-forwarded-host"),
    "host (original)": h.get("x-diag-host"),
    "x-forwarded-host (após ajuste)": h.get("x-forwarded-host"),
    referer: h.get("referer"),
  });
}
