import { NextResponse, type NextRequest } from "next/server";

/**
 * Em desenvolvimento (e dentro do GitHub Codespaces) o site é aberto por um endereço público
 * que passa por proxies. O Next.js compara a "origem" do formulário com o host recebido e,
 * se forem diferentes, recusa ("Invalid Server Actions request"). Como cada proxy/navegador
 * monta esses cabeçalhos de um jeito, em desenvolvimento alinhamos o host encaminhado com a
 * origem informada pelo navegador. Em produção nada muda: a proteção contra CSRF continua ativa.
 */
export function middleware(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production" || process.env.CODESPACES === "true";
  if (!isDev || req.method !== "POST") return NextResponse.next();
  const headers = new Headers(req.headers);
  // Guarda os valores originais para a página /diagnostico
  headers.set("x-diag-origin", req.headers.get("origin") ?? "(ausente)");
  headers.set("x-diag-forwarded-host", req.headers.get("x-forwarded-host") ?? "(ausente)");
  headers.set("x-diag-host", req.headers.get("host") ?? "(ausente)");
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      headers.set("x-forwarded-host", new URL(origin).host);
    } catch {
      headers.delete("origin"); // origem inválida (ex.: "null"): o Next trata como ausente
    }
  }
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/((?!_next/static|_next/image|mentores/|favicon.ico).*)"] };
