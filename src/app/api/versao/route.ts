import { config } from "@/lib/config";

/** Diagnóstico simples: versão do código e configurações não sigilosas. */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    versao: "2026-11-23.4",
    exigeConfirmacaoDeEmail: config.requireEmailVerification,
    valorRecebido: process.env.REQUIRE_EMAIL_VERIFICATION === undefined ? "(não definida)" : JSON.stringify(process.env.REQUIRE_EMAIL_VERIFICATION),
    banco: process.env.DATABASE_URL ? "postgres" : "local",
  });
}
