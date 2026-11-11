"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { saveCookieConsent } from "@/app/actions/privacy";

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(!document.cookie.includes("vr_cookie_consent="));
    const reopen = () => setShow(true);
    window.addEventListener("vr:cookies", reopen);
    return () => window.removeEventListener("vr:cookies", reopen);
  }, []);
  if (!show) return null;
  const choose = async (analytics: boolean) => {
    document.cookie = `vr_cookie_consent=${analytics ? "all" : "essential"}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
    setShow(false);
    await saveCookieConsent(analytics);
  };
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl bg-noite p-4 text-white shadow-xl sm:flex sm:items-center sm:gap-4" role="dialog" aria-label="Cookies">
      <p className="text-sm">
        Usamos cookies essenciais e, se você deixar, de medição.{" "}
        <Link href="/cookies" className="underline">
          Saiba mais
        </Link>
      </p>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <button className="btn-highlight btn-sm" onClick={() => choose(true)}>
          Aceitar
        </button>
        <button className="btn btn-sm border border-white/30 text-white" onClick={() => choose(false)}>
          Só essenciais
        </button>
      </div>
    </div>
  );
}

export function CookieSettingsLink() {
  return (
    <button className="hover:text-white" onClick={() => window.dispatchEvent(new Event("vr:cookies"))}>
      Preferências de cookies
    </button>
  );
}
