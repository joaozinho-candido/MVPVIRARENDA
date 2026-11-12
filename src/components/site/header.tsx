"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "../ui";

const NAV = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#oportunidades", label: "Oportunidades" },
  { href: "/#mentores", label: "Mentores" },
  { href: "/planos", label: "Plano" },
  { href: "/#duvidas", label: "Dúvidas" },
];

export function SiteHeader({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <header className="sticky top-0 z-40 bg-vira">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo dark />
        <nav className="hidden items-center gap-6 text-[15px] md:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-white/85 hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {loggedIn ? (
            <Link href="/app" className="btn-highlight btn-sm">
              Minha área
            </Link>
          ) : (
            <>
              <Link href="/entrar" className="btn btn-sm px-3 text-white hover:underline">
                Entrar
              </Link>
              <Link href="/questionario" className="btn-highlight btn-sm">
                Começar
              </Link>
            </>
          )}
        </div>
        <button className="btn -mr-2 px-3 text-2xl text-white md:hidden" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(true)}>
          ☰
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-areia p-4 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex h-12 items-center justify-between">
            <Logo />
            <button className="btn-ghost text-2xl text-noite" aria-label="Fechar menu" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <nav className="mt-6 flex flex-col" aria-label="Principal">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-tinta/10 py-4 font-display text-2xl font-semibold text-noite">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            <Link href={loggedIn ? "/app" : "/questionario"} onClick={() => setOpen(false)} className="btn-primary">
              {loggedIn ? "Minha área" : "Começar grátis"}
            </Link>
            {!loggedIn && (
              <Link href="/entrar" onClick={() => setOpen(false)} className="btn-secondary">
                Já tenho conta · Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/** No celular, o botão principal gruda no rodapé ao rolar. */
export function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 520);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-tinta/10 bg-white/95 p-3 backdrop-blur md:hidden">
      <Link href="/questionario" className="btn-primary w-full">
        Começar grátis
      </Link>
    </div>
  );
}
