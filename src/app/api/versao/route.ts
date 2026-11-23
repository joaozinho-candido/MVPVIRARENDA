/** Diagnóstico simples: mostra a versão do código em execução. */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ versao: "2026-11-23.1", correcaoCodespaces: "middleware + allowedOrigins" });
}
