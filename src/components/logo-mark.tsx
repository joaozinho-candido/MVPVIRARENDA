/** Símbolo do Vira Renda: seta circular (virada) com a moeda/semente amarela ao centro. */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden focusable="false">
      <rect width="100" height="100" rx="24" fill="#0B8A4E" />
      <path d="M50 23.7 A25 25 0 1 0 74.9 50.9" fill="none" stroke="#FFFFFF" strokeWidth="10.5" strokeLinecap="round" />
      <path d="M75 33 L85 52.5 L65 52.5 Z" fill="#FFFFFF" strokeLinejoin="round" />
      <circle cx="50" cy="48.7" r="9.7" fill="#FFC83D" />
    </svg>
  );
}
