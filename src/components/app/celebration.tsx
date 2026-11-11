"use client";
import { useEffect, useRef, useState } from "react";

/** Palmas sintetizadas (sem arquivo de áudio). Só tocam se a pessoa deixou o som ligado. */
function clap() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    for (let k = 0; k < 6; k++) {
      const t = ctx.currentTime + k * 0.13 + Math.random() * 0.03;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1400;
      const g = ctx.createGain();
      g.gain.value = 0.6;
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(t);
    }
    setTimeout(() => ctx.close(), 1500);
  } catch {}
}

const COLORS = ["#0B8A4E", "#FFC83D", "#FF6A3D", "#0F2A1E", "#5BE09A"];

function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d")!;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const parts = Array.from({ length: 140 }, () => ({
      x: c.width / 2 + (Math.random() - 0.5) * 200,
      y: c.height / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 16 - 4,
      r: Math.random() * 6 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI,
    }));
    let frame = 0;
    let id = 0;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of parts) {
        p.vy += 0.45;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += 0.1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();
      }
      if (++frame < 160) id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[60]" aria-hidden />;
}

export function Celebration({
  title = "Missão concluída!",
  subtitle,
  points,
  lines = [],
  sound,
  autoOpen = false,
  onClose,
  next,
}: {
  title?: string;
  subtitle?: string;
  points?: number;
  lines?: string[];
  sound: boolean;
  autoOpen?: boolean;
  onClose?: () => void;
  next?: React.ReactNode;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [soundOn, setSoundOn] = useState(sound);
  useEffect(() => {
    if (open && soundOn) clap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!open) return null;
  const close = () => {
    setOpen(false);
    onClose?.();
  };
  return (
    <>
      <Confetti />
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-noite/40 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
        <div className="w-full max-w-sm animate-pop rounded-card bg-white p-6 text-center shadow-xl">
          <p className="text-5xl" aria-hidden>👏🎉</p>
          <h2 id="celebration-title" className="mt-2 font-display text-2xl font-extrabold text-noite">{title}</h2>
          {subtitle && <p className="mt-1 text-tinta-soft">{subtitle}</p>}
          {!!points && <p className="mt-3 inline-block rounded-full bg-festa px-4 py-1.5 font-display text-lg font-bold text-white">+{points} pontos</p>}
          {lines.map((l) => (
            <p key={l} className="mt-2 text-[15px]">{l}</p>
          ))}
          <div className="mt-5 flex flex-col gap-2">
            {next}
            <button className="btn-primary" onClick={close}>
              Continuar
            </button>
          </div>
          <button className="mt-3 text-sm text-tinta-soft" onClick={() => setSoundOn(!soundOn)} aria-pressed={soundOn}>
            {soundOn ? "🔊 Som ligado · Silenciar" : "🔇 Som desligado · Ligar"}
          </button>
        </div>
      </div>
    </>
  );
}
