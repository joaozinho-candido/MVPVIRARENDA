import Link from "next/link";
import { brl } from "@/lib/format";

export function SubscribeCta({ first, price }: { first: number; price: number }) {
  return (
    <div className="rounded-card bg-noite p-6 text-white">
      <p className="font-display text-xl font-bold">Libere as 3 oportunidades e a jornada completa</p>
      <p className="mt-2 text-white/80">
        1º mês por <b className="text-white">{brl(first)}</b>, depois <b className="text-white">{brl(price)}/mês</b>. Cancele quando quiser.
      </p>
      <Link href="/assinar" className="btn-highlight mt-4">
        Assinar por {brl(first)}
      </Link>
    </div>
  );
}
