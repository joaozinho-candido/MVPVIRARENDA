"use client";
import { useState, useTransition } from "react";
import { resendVerificationAction } from "@/app/actions/auth";

export function ResendVerification() {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="btn-secondary btn-sm" disabled={pending} onClick={() => start(async () => { const r = await resendVerificationAction(); setMsg(r.ok ? (r.message ?? "") : r.error); })}>
        Reenviar link
      </button>
      {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}
