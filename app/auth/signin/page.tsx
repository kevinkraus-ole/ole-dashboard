"use client";

import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes:
          "openid email profile https://www.googleapis.com/auth/bigquery.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 w-full max-w-sm flex flex-col items-center gap-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold tracking-tight"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          OL
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-slate-900">Olé Life</h1>
          <p className="text-sm text-slate-400 mt-1">Dashboard de Producción</p>
        </div>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 w-full text-center">
            {error === "auth_failed"
              ? "Error al autenticar. Intentá de nuevo."
              : "Ocurrió un error. Intentá de nuevo."}
          </p>
        )}
        <button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
          </svg>
          Iniciar sesión con Google
        </button>
        <p className="text-xs text-slate-400 text-center">
          Solo cuentas @olelife.com
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
