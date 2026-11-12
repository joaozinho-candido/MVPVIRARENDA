/** Diagnóstico simples: mostra a versão do código em execução. */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ versao: "2026-11-12.3", correcaoCodespaces: "middleware + allowedOrigins" });
}
