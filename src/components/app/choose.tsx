"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { chooseOpportunityAction } from "@/app/actions/journey";

export function ChooseButton({ id, chosen, className = "btn-primary w-full" }: { id: string; chosen: boolean; className?: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();
  if (chosen) return <p className="rounded-full bg-vira-light px-4 py-3 text-center font-semibold text-vira-dark">✓ Seu caminho</p>;
  return (
    <div>
      <button
        className={className}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await chooseOpportunityAction(id);
            if (!r.ok) return setErr(r.error);
            router.push("/app?escolheu=1");
          })
        }
      >
        {pending ? "Escolhendo…" : "Escolher este caminho"}
      </button>
      {err && <p className="help">{err}</p>}
    </div>
  );
}
