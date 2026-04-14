import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Olé Life — Dashboard de Producción",
  description: "Cotizaciones, invitaciones y pólizas por agencia",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f7f8fa]">
        {/* ── Top navigation bar ── */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center px-8 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold tracking-tight shrink-0"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
            >
              OL
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold text-slate-900 leading-tight">
                Olé Life
              </span>
              <span className="text-[10px] text-slate-400 leading-tight tracking-widest uppercase mt-0.5">
                Dashboard de Producción
              </span>
            </div>
          </div>

          <div className="flex-1" />

          <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            olelifetech · gold_zone
          </span>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
