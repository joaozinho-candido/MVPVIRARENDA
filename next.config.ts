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
 * Sem isso o Next.js recusa login, cadastro e qualquer formulário (proteção contra CSRF).
 */
function allowedOrigins(): string[] {
  const list = (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const cs = process.env.CODESPACE_NAME;
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? "app.github.dev";
  if (cs) list.push(`${cs}-3000.${domain}`);
  return list;
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: { serverActions: { allowedOrigins: allowedOrigins() } },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
