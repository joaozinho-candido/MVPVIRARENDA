"use client";
import Link from "next/link";
import { useOptimistic, useTransition, useState } from "react";
import { moveClientAction } from "@/app/actions/work";
import type { ClientStatus } from "@/db/schema";

type Card = { id: string; name: string; origin: string; channel: string; status: ClientStatus; nextAction: string; nextLabel: string; due: boolean };

export function CrmBoard({ columns, clients }: { columns: { value: ClientStatus; label: string }[]; clients: Card[] }) {
  const [items, move] = useOptimistic(clients, (state, p: { id: string; status: ClientStatus }) => state.map((c) => (c.id === p.id ? { ...c, status: p.status } : c)));
  const [, start] = useTransition();
  const [over, setOver] = useState<ClientStatus | null>(null);
  const doMove = (id: string, status: ClientStatus) =>
    start(async () => {
      move({ id, status });
      await moveClientAction(id, status);
    });
  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
      {columns.map((col) => {
        const list = items.filter((c) => c.status === col.value);
        return (
          <section
            key={col.value}
            aria-label={col.label}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.value);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/plain");
              if (id) doMove(id, col.value);
            }}
            className={`w-64 shrink-0 snap-start rounded-2xl p-2 lg:w-auto ${over === col.value ? "bg-vira-light" : "bg-areia-dark/60"}`}
          >
            <h2 className="px-2 py-2 text-sm font-semibold">
              {col.label} · {list.length}
            </h2>
            <ul className="space-y-2">
              {list.map((c) => (
                <li key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)} className="cursor-grab rounded-xl bg-white p-3 shadow-sm active:cursor-grabbing">
                  <Link href={`/app/clientes/${c.id}`} className="block font-semibold text-noite hover:underline">
                    {c.name}
                  </Link>
                  <p className="text-xs text-tinta-soft">{c.origin || c.channel}</p>
                  {c.nextAction && <p className={`mt-1 text-sm ${c.due ? "font-semibold text-festa-dark" : "text-vira"}`}>{c.nextLabel}</p>}
                  <label className="sr-only" htmlFor={`mv-${c.id}`}>Mudar status de {c.name}</label>
                  <select id={`mv-${c.id}`} value={c.status} onChange={(e) => doMove(c.id, e.target.value as ClientStatus)} className="mt-2 w-full rounded-lg border border-tinta/10 bg-areia px-2 py-1.5 text-xs lg:hidden">
                    {columns.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
