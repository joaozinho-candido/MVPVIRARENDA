import Link from "next/link";
import { MORE_LINKS } from "@/components/app/shell";
import { logoutAction } from "@/app/actions/auth";

export default function Page() {
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold text-noite">Mais</h1>
      <nav className="divide-y divide-tinta/10 rounded-card bg-white shadow-sm">
        {MORE_LINKS.map((n) => (
          <Link key={n.href} href={n.href} className="flex min-h-14 items-center gap-3 px-5 text-[16px]">
            <span aria-hidden>{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
      <form action={logoutAction} className="mt-6">
        <button className="btn-secondary w-full">Sair</button>
      </form>
    </div>
  );
}
