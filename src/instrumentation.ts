/**
 * Roda uma vez quando o servidor inicia. Em desenvolvimento com o banco local (PGlite),
 * aplica as migrações e cria os dados base, o admin e as contas de demonstração se faltarem.
 * Assim o login funciona mesmo que a preparação do Codespaces tenha falhado ou sido interrompida.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { prepareLocalDatabase } = await import("./instrumentation-node");
    await prepareLocalDatabase();
  }
}
