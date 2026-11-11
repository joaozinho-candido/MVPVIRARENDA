import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { getSessionUser } from "@/server/session";

export const metadata = { title: "Entrar" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; senha?: string }> }) {
  const sp = await searchParams;
  if (await getSessionUser()) redirect(sp.next ?? "/app");
  return <LoginForm next={sp.next} notice={sp.senha === "nova" ? "Senha alterada. Entre com a nova senha." : undefined} />;
}
