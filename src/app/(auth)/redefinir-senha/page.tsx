import Link from "next/link";
import { ResetForm } from "@/components/auth-forms";

export const metadata = { title: "Nova senha" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token)
    return (
      <div className="card">
        <p>Link incompleto. <Link href="/recuperar-senha" className="link">Peça um novo</Link>.</p>
      </div>
    );
  return <ResetForm token={token} />;
}
