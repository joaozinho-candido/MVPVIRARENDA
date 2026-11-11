import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Vira Renda · Seu talento vira renda", template: "%s · Vira Renda" },
  description: "Descubra oportunidades de renda extra que combinam com seus talentos, seu tempo e os recursos que você já tem. Sem promessa de ganhos, com um plano claro.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0B8A4E" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
