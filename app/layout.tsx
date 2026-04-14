import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Olé Life — Dashboard",
  description: "Dashboard de cotizaciones, invitaciones y pólizas",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {/* Top nav */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="mx-auto max-w-screen-2xl px-6 h-14 flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">Olé</span>
            </div>
            <span className="font-semibold text-slate-800 tracking-tight">
              Dashboard de Producción
            </span>
            <div className="flex-1" />
            <span className="text-xs text-slate-400">olelifetech</span>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
