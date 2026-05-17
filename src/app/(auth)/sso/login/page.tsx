"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SSOLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const ssoToken = searchParams.get("token");

    if (!ssoToken) {
      setStatus("error");
      setErrorMessage("No Single Sign-On token was supplied in the request URL.");
      return;
    }

    const authenticateSSO = async () => {
      try {
        const result = await signIn("credentials", {
          ssoToken,
          redirect: false,
        });

        if (result?.error) {
          setStatus("error");
          setErrorMessage(result.error);
        } else {
          setStatus("success");
          // Short visual grace delay before redirect
          setTimeout(() => {
            router.push("/dashboard");
          }, 1200);
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage("An unexpected error occurred during Single Sign-On session validation.");
      }
    };

    authenticateSSO();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen w-full flex bg-slate-950 selection:bg-primary/20 items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Glassmorphism Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.18),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(244,63,94,0.1),transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-slate-900/75 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-8 flex flex-col items-center transition-all duration-300">
        {/* Logo and Brand Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner shadow-primary/5">
            <Image 
              src="/logo.png" 
              alt="Resolve Logo" 
              width={48} 
              height={48} 
              style={{ width: 48, height: 48 }} 
              className="rounded-lg object-contain" 
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Resolve
            </h1>
            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              Incident Command Centre
            </p>
          </div>
        </div>

        {/* Dynamic Authentication Flow States */}
        {status === "loading" && (
          <div className="flex flex-col items-center text-center space-y-5 py-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute size-14 bg-primary/20 rounded-full animate-ping opacity-75" />
              <div className="relative p-4 bg-primary/10 rounded-full border border-primary/30">
                <Loader2 className="size-8 text-primary animate-spin" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Verifying Identity</h2>
              <p className="text-sm text-slate-400 max-w-[280px]">
                Validating security credentials from AppHub. Please hold...
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center text-center space-y-5 py-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="size-8 text-emerald-400 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-emerald-400">SSO Verified Successfully</h2>
              <p className="text-sm text-slate-300">
                Welcome back! Directing you to your Control Panel...
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
              <ShieldAlert className="size-8 text-rose-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-rose-400">SSO Authentication Failed</h2>
              <p className="text-xs leading-relaxed font-mono bg-rose-950/40 border border-rose-900/40 p-4 rounded-lg text-left text-rose-200 max-w-[320px]">
                {errorMessage || "An unrecognized SSO error occurred."}
              </p>
            </div>
            <div className="w-full pt-4">
              <Button asChild className="w-full h-11 text-xs font-bold text-white border-slate-700 hover:bg-slate-800/50 hover:text-white" variant="outline">
                <a href={process.env.NEXT_PUBLIC_APPHUB_URL || "http://localhost:5173"}>
                  <ArrowLeft className="size-3.5 mr-2" /> Return to AppHub
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Footer Brand Info */}
        <div className="pt-6 border-t border-slate-800 w-full text-center flex flex-col items-center space-y-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <span>Enterprise Secure SSO Route</span>
        </div>
      </div>
    </div>
  );
}
