import { NextResponse, type NextRequest } from "next/server";

/**
 * GitHub Codespaces (e proxies parecidos) abrem o site por https://<nome>-3000.app.github.dev,
 * mas repassam a requisição ao servidor como localhost:3000. O Next.js compara a origem do
 * formulário com o host e, se forem diferentes, recusa a ação ("Invalid Server Actions request").
 * Em desenvolvimento/Codespaces, alinhamos o host encaminhado com a origem do Codespaces.
 * Em produção nada muda.
 */
const FORWARDING_SUFFIXES = [".app.github.dev", ".preview.app.github.dev"];

export function middleware(req: NextRequest) {
  const enabled = process.env.NODE_ENV !== "production" || process.env.CODESPACES === "true";
  const origin = req.headers.get("origin");
  if (!enabled || !origin || req.method !== "POST") return NextResponse.next();
  let originHost: string;
  let originHostname: string;
  try {
    ({ host: originHost, hostname: originHostname } = new URL(origin));
  } catch {
    return NextResponse.next();
  }
  if (!FORWARDING_SUFFIXES.some((s) => originHostname.endsWith(s))) return NextResponse.next();
  const headers = new Headers(req.headers);
  headers.set("x-forwarded-host", originHost);
  headers.set("x-forwarded-proto", "https");
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|mentores/|favicon.ico).*)"] };
