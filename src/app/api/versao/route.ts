/** Diagnóstico simples: mostra a versão do código em execução. */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ versao: "2026-11-23.2", correcaoCodespaces: "middleware + allowedOrigins" });
}
