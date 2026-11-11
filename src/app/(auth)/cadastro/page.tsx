import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth-forms";
import { getSessionUser } from "@/server/session";

export const metadata = { title: "Criar conta" };

export default async function Page({ searchParams }: { searchParams: Promise<{ resultado?: string }> }) {
  if (await getSessionUser()) redirect("/app");
  const sp = await searchParams;
  return <RegisterForm fromQuiz={sp.resultado === "1"} />;
}
