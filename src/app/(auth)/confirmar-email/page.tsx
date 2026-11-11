import Link from "next/link";
import { verifyEmail } from "@/server/auth";

export const metadata = { title: "Confirmar e-mail" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  let ok = false;
  let message = "Link incompleto.";
  if (token) {
    try {
      await verifyEmail(token);
      ok = true;
    } catch (e) {
      message = (e as Error).message;
    }
  }
  return (
    <div className="card text-center">
      <p className="text-4xl">{ok ? "✉️" : "⌛"}</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-noite">{ok ? "E-mail confirmado!" : "Não deu certo"}</h1>
      <p className="mt-2 text-tinta-soft">{ok ? "Agora você já pode assinar o plano." : message}</p>
      <Link href={ok ? "/assinar" : "/app/perfil"} className="btn-primary mt-6 w-full">
        {ok ? "Continuar" : "Ir para meu perfil"}
      </Link>
    </div>
  );
}
