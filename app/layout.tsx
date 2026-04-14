import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Olé Life — Dashboard de Producción",
  description: "Cotizaciones, invitaciones y pólizas por agencia",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ background: "#f1f5f9" }}>
        {/* ── Top navigation bar ── */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] font-bold tracking-tight shrink-0"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
            >
              OL
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold text-slate-800 leading-tight">
                Olé Life
              </span>
              <span className="text-[10px] text-slate-400 leading-tight tracking-wide uppercase">
                Dashboard de Producción
              </span>
            </div>
          </div>

          <div className="flex-1" />

          {/* Right info */}
          <span className="text-xs text-slate-400 font-mono">
            olelifetech · gold_zone
          </span>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
