import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/**
 * Domínios autorizados a enviar formulários (Server Actions) quando o app roda atrás de um proxy
 * que troca o endereço, como o GitHub Codespaces (*.app.github.dev → localhost:3000).
 * Sem isso o Next.js recusa login, cadastro e qualquer formulário ("Invalid Server Actions request").
 * Em desenvolvimento e dentro do Codespaces liberamos os domínios de encaminhamento do GitHub;
 * em produção só o que estiver em SERVER_ACTIONS_ALLOWED_ORIGINS.
 */
function allowedOrigins(): string[] {
  const list = (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const inCodespaces = process.env.CODESPACES === "true" || !!process.env.CODESPACE_NAME;
  if (inCodespaces || process.env.NODE_ENV !== "production") {
    const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? "app.github.dev";
    list.push(`*.${domain}`, "*.app.github.dev", "*.preview.app.github.dev");
  }
  const unique = [...new Set(list)];
  if (unique.length) console.log(`[vira-renda] Formulários liberados também para: ${unique.join(", ")}`);
  return unique;
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: { serverActions: { allowedOrigins: allowedOrigins() } },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
