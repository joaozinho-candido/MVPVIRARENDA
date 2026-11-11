"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { simulatePixAction } from "@/app/actions/billing";

export function PixPending({ paymentId, code, expiresAt, demo }: { paymentId: string; code: string; expiresAt: string; demo: boolean }) {
  const router = useRouter();
  const [left, setLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    const poll = setInterval(() => router.refresh(), 4000); // confere sozinha se o pagamento entrou
    return () => {
      clearInterval(t);
      clearInterval(poll);
    };
  }, [expiresAt, router]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="space-y-4">
      <div className="mx-auto grid h-44 w-44 grid-cols-8 gap-0.5 rounded-xl bg-white p-3 ring-1 ring-tinta/10" aria-label="QR Code ilustrativo">
        {Array.from({ length: 64 }).map((_, i) => (
          <span key={i} className={(i * 7 + code.charCodeAt(i % code.length)) % 3 === 0 ? "bg-noite" : "bg-white"} />
        ))}
      </div>
      <button
        type="button"
        className="btn-primary w-full"
        onClick={async () => {
          await navigator.clipboard?.writeText(code).catch(() => {});
          setCopied(true);
        }}
      >
        {copied ? "✓ Código copiado" : "Copiar código Pix"}
      </button>
      <p className="break-all rounded-xl bg-areia p-3 font-mono text-xs">{code}</p>
      <p className="text-center text-sm text-tinta-soft">
        Vale por {mm}:{ss}. Pode fechar esta tela: avisamos por e-mail quando confirmar.
      </p>
      {demo && (
        <div className="rounded-2xl border border-dashed border-sol p-3 text-sm">
          <p className="mb-2 font-semibold">Modo demonstração</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-highlight btn-sm" disabled={pending} onClick={() => start(() => simulatePixAction(paymentId, "approved"))}>
              Simular pagamento do Pix
            </button>
            <button type="button" className="btn-secondary btn-sm" disabled={pending} onClick={() => start(() => simulatePixAction(paymentId, "expired"))}>
              Simular vencimento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
